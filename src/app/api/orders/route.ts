import crypto from "crypto";
import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { sendAdminOrderNotification, sendOrderConfirmation, sendOutOfStockAlert } from "@/lib/server/email";
import { createPreference, isMpConfigured } from "@/lib/server/mercadopago";
import { getSessionUser } from "@/lib/server/session";
import { computeShippingCost } from "@/lib/shippingCalc";
import { MERCADOPAGO_ENABLED } from "@/lib/site";
import { isValidPhone, PHONE_HINT } from "@/lib/validation";
import { rateLimit } from "@/lib/server/ratelimit";
import { effectivePrice, typeAllowsCustomization, type ProductType } from "@/lib/api";

type Body = {
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  street?: string;
  postalCode?: string;
  city?: string;
  province?: string;
  floor?: string;
  apartment?: string;
  deliveryNotes?: string;
  paymentMethod?: "MercadoPago" | "Transfer";
  isGift?: boolean;
  giftMessage?: string;
  items?: {
    productId: number;
    quantity: number;
    size?: string;
    customName?: string | null;
    customNumber?: string | null;
    patchId?: number | null;
  }[];
};

/** Error de validación de negocio (stock, producto, parche) — se traduce a 400. */
class OrderError extends Error {}

export async function POST(req: Request) {
  const limited = await rateLimit("orders", req, 10, 10 * 60);
  if (limited) return limited;

  const body = (await req.json()) as Body;

  const errors: Record<string, string[]> = {};
  if (!body.customerName?.trim()) errors.customerName = ["Ingresá tu nombre."];
  if (!body.customerEmail?.trim()) errors.customerEmail = ["Ingresá tu email."];
  if (!body.customerPhone?.trim()) errors.customerPhone = ["Ingresá tu teléfono."];
  else if (!isValidPhone(body.customerPhone)) errors.customerPhone = [PHONE_HINT];
  if (!body.street?.trim()) errors.street = ["Ingresá la calle y el número."];
  if (!body.postalCode?.trim()) errors.postalCode = ["Ingresá el código postal."];
  if (!body.city?.trim()) errors.city = ["Ingresá la ciudad."];
  if (!body.province?.trim()) errors.province = ["Ingresá la provincia."];
  const paymentMethod =
    MERCADOPAGO_ENABLED && body.paymentMethod === "MercadoPago" ? "MercadoPago" : "Transfer";
  if (!Array.isArray(body.items) || body.items.length === 0) errors.items = ["El carrito está vacío."];
  if (Object.keys(errors).length) return NextResponse.json({ errors }, { status: 400 });

  // Si el comprador está logueado, el pedido se vincula a su cuenta.
  const sessionUser = await getSessionUser();

  const justSoldOut: { team: string; slug: string }[] = [];
  const touchedSlugs = new Set<string>();

  let order;
  try {
    order = await prisma.$transaction(async (tx) => {
      // Precios, stock y personalización SIEMPRE resueltos desde la base:
      // - el precio del parche viene del producto, no de lo que mande el cliente.
      // - si el producto tiene nombre/número predefinidos, se ignora lo que mande el cliente.
      // - el stock se descuenta de forma atómica (UPDATE ... WHERE stock >= cantidad),
      //   así dos compras simultáneas nunca pueden vender la misma última unidad dos veces.
      const itemsData: {
        productId: number;
        productName: string;
        unitPrice: number;
        quantity: number;
        size: string;
        customName: string | null;
        customNumber: string | null;
        patchLabel: string | null;
        patchExtraPrice: number | null;
      }[] = [];

      for (const line of body.items!) {
        const qty = Number(line.quantity);
        if (!Number.isInteger(qty) || qty <= 0) throw new OrderError("Cantidad inválida.");

        const product = await tx.product.findUnique({
          where: { id: Number(line.productId) },
          include: { patches: true },
        });
        if (!product) throw new OrderError(`Producto no disponible (id ${line.productId}).`);

        const size = line.size?.trim() ?? "";
        if (!product.sizes.includes(size)) {
          throw new OrderError(`Elegí un talle válido para "${product.team}".`);
        }

        const canCustomize = typeAllowsCustomization(product.type as ProductType);

        let patch = null;
        if (canCustomize && line.patchId != null) {
          patch = product.patches.find((p) => p.id === Number(line.patchId));
          if (!patch) throw new OrderError("El parche elegido no es válido para ese producto.");
        }

        // El stock se reserva de forma atómica por talle (no solo por producto), así dos
        // compras simultáneas del mismo talle nunca pueden vender la misma última unidad dos veces.
        const reserved = await tx.productSize.updateMany({
          where: { productId: product.id, size, stock: { gte: qty } },
          data: { stock: { decrement: qty } },
        });
        if (reserved.count === 0) {
          const current = await tx.productSize.findUnique({
            where: { productId_size: { productId: product.id, size } },
          });
          throw new OrderError(
            `No hay stock suficiente de "${product.team}" en talle ${size} (quedan ${current?.stock ?? 0}).`,
          );
        }
        await tx.product.update({ where: { id: product.id }, data: { stock: { decrement: qty } } });
        touchedSlugs.add(product.slug);
        if (product.stock - qty === 0) {
          justSoldOut.push({ team: product.team, slug: product.slug });
        }

        itemsData.push({
          productId: product.id,
          productName: product.team,
          unitPrice: effectivePrice(product) + (patch?.extraPrice ?? 0),
          quantity: qty,
          size,
          customName: canCustomize ? product.presetName ?? (line.customName?.trim() || null) : null,
          customNumber: canCustomize ? product.presetNumber ?? (line.customNumber?.trim() || null) : null,
          patchLabel: patch?.label ?? null,
          patchExtraPrice: patch ? patch.extraPrice : null,
        });
      }

      const subtotal = itemsData.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
      const shippingSettings = await tx.shippingSettings.findUnique({ where: { id: 1 } });
      const shippingCost = computeShippingCost(subtotal, {
        flatCost: shippingSettings?.flatCost ?? 0,
        freeShippingThreshold: shippingSettings?.freeShippingThreshold ?? null,
      });
      const total = subtotal + shippingCost;
      const publicId = crypto.randomBytes(6).toString("hex");

      return tx.order.create({
        data: {
          publicId,
          kind: "Stock",
          status: "Pending",
          userId: sessionUser?.id ?? null,
          customerName: body.customerName!.trim(),
          customerEmail: body.customerEmail!.trim().toLowerCase(),
          customerPhone: body.customerPhone!.trim(),
          street: body.street!.trim(),
          postalCode: body.postalCode!.trim(),
          city: body.city!.trim(),
          province: body.province!.trim(),
          floor: body.floor?.trim() || null,
          apartment: body.apartment?.trim() || null,
          deliveryNotes: body.deliveryNotes?.trim() || null,
          isGift: !!body.isGift,
          giftMessage: body.isGift ? body.giftMessage?.trim() || null : null,
          paymentMethod,
          total,
          shippingCost,
          items: { create: itemsData },
        },
        include: { items: true },
      });
    });
  } catch (err) {
    if (err instanceof OrderError) return NextResponse.json({ error: err.message }, { status: 400 });
    throw err;
  }

  // El stock recién descontado no debe esperar hasta la próxima revalidación
  // automática para reflejarse en la home y en las páginas de producto.
  revalidatePath("/");
  for (const slug of touchedSlugs) revalidatePath(`/producto/${slug}`);

  await sendOrderConfirmation({
    publicId: order.publicId,
    customerEmail: order.customerEmail,
    customerName: order.customerName,
    total: order.total,
    items: order.items,
  }).catch(() => {}); // el pedido ya quedó registrado igual si el email falla

  await sendAdminOrderNotification({
    publicId: order.publicId,
    kind: "Stock",
    customerName: order.customerName,
    customerPhone: order.customerPhone,
    total: order.total,
    itemsSummary: order.items.map((i) => `${i.productName} x${i.quantity} (talle ${i.size})`).join(", "),
  }).catch(() => {});

  if (justSoldOut.length > 0) {
    await sendOutOfStockAlert(justSoldOut).catch(() => {});
  }

  // Guardamos los datos usados en este checkout en el perfil, para prellenar la próxima compra.
  if (sessionUser) {
    await prisma.user
      .update({
        where: { id: sessionUser.id },
        data: {
          name: body.customerName!.trim(),
          phone: body.customerPhone!.trim(),
          street: body.street!.trim(),
          postalCode: body.postalCode!.trim(),
          city: body.city!.trim(),
          province: body.province!.trim(),
          floor: body.floor?.trim() || null,
          apartment: body.apartment?.trim() || null,
        },
      })
      .catch(() => {}); // no crítico: si falla, el pedido ya quedó registrado igual
  }

  let checkoutUrl: string | null = null;
  if (MERCADOPAGO_ENABLED && paymentMethod === "MercadoPago" && isMpConfigured()) {
    checkoutUrl = await createPreference({
      publicId: order.publicId,
      customerName: order.customerName,
      customerEmail: order.customerEmail,
      items: order.items,
      shippingCost: order.shippingCost,
    });
  }

  return NextResponse.json({
    orderId: order.publicId,
    shippingCost: order.shippingCost,
    total: order.total,
    status: order.status,
    paymentMethod: order.paymentMethod,
    checkoutUrl,
  });
}
