import crypto from "crypto";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createPreference, isMpConfigured } from "@/lib/server/mercadopago";
import { isValidPhone, PHONE_HINT } from "@/lib/validation";

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
  items?: {
    productId: number;
    quantity: number;
    customName?: string | null;
    customNumber?: string | null;
    patchId?: number | null;
  }[];
};

export async function POST(req: Request) {
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
  const paymentMethod = body.paymentMethod === "Transfer" ? "Transfer" : "MercadoPago";
  if (!Array.isArray(body.items) || body.items.length === 0) errors.items = ["El carrito está vacío."];
  if (Object.keys(errors).length) return NextResponse.json({ errors }, { status: 400 });

  // Precios y personalización SIEMPRE resueltos desde la base:
  // - el precio del parche viene del producto, no de lo que mande el cliente.
  // - si el producto tiene nombre/número predefinidos, se ignora lo que mande el cliente.
  const itemsData: {
    productId: number;
    productName: string;
    unitPrice: number;
    quantity: number;
    customName: string | null;
    customNumber: string | null;
    patchLabel: string | null;
    patchExtraPrice: number | null;
  }[] = [];

  for (const line of body.items!) {
    const qty = Number(line.quantity);
    if (!Number.isInteger(qty) || qty <= 0)
      return NextResponse.json({ error: "Cantidad inválida." }, { status: 400 });

    const product = await prisma.product.findUnique({
      where: { id: Number(line.productId) },
      include: { patches: true },
    });
    if (!product || !product.inStock)
      return NextResponse.json({ error: `Producto no disponible (id ${line.productId}).` }, { status: 400 });

    let patch = null;
    if (line.patchId != null) {
      patch = product.patches.find((p) => p.id === Number(line.patchId));
      if (!patch)
        return NextResponse.json({ error: "El parche elegido no es válido para ese producto." }, { status: 400 });
    }

    itemsData.push({
      productId: product.id,
      productName: product.team,
      unitPrice: product.price + (patch?.extraPrice ?? 0),
      quantity: qty,
      customName: product.presetName ?? (line.customName?.trim() || null),
      customNumber: product.presetNumber ?? (line.customNumber?.trim() || null),
      patchLabel: patch?.label ?? null,
      patchExtraPrice: patch ? patch.extraPrice : null,
    });
  }

  const total = itemsData.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
  const publicId = crypto.randomBytes(6).toString("hex");

  const order = await prisma.order.create({
    data: {
      publicId,
      kind: "Stock",
      status: "Pending",
      customerName: body.customerName!.trim(),
      customerEmail: body.customerEmail!.trim(),
      customerPhone: body.customerPhone!.trim(),
      street: body.street!.trim(),
      postalCode: body.postalCode!.trim(),
      city: body.city!.trim(),
      province: body.province!.trim(),
      floor: body.floor?.trim() || null,
      apartment: body.apartment?.trim() || null,
      deliveryNotes: body.deliveryNotes?.trim() || null,
      paymentMethod,
      total,
      items: { create: itemsData },
    },
    include: { items: true },
  });

  let checkoutUrl: string | null = null;
  if (paymentMethod === "MercadoPago" && isMpConfigured()) {
    checkoutUrl = await createPreference({
      publicId: order.publicId,
      customerName: order.customerName,
      customerEmail: order.customerEmail,
      items: order.items,
    });
  }

  return NextResponse.json({
    orderId: order.publicId,
    total: order.total,
    status: order.status,
    paymentMethod: order.paymentMethod,
    checkoutUrl,
  });
}
