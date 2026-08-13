import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdmin } from "@/lib/server/auth";
import { sendPaymentConfirmation, sendShippingNotification } from "@/lib/server/email";

const VALID = ["Pending", "Paid", "Cancelled", "Delivered"];

export async function POST(req: Request, { params }: { params: Promise<{ publicId: string }> }) {
  if (!isAdmin(req)) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const { publicId } = await params;
  const { status, total, trackingNumber } = (await req.json()) as {
    status?: string;
    total?: number;
    trackingNumber?: string;
  };

  if (status !== undefined && !VALID.includes(status))
    return NextResponse.json({ error: "Estado inválido." }, { status: 400 });
  if (total !== undefined && (typeof total !== "number" || !Number.isFinite(total) || total < 0))
    return NextResponse.json({ error: "Precio inválido." }, { status: 400 });
  if (status === undefined && total === undefined && trackingNumber === undefined)
    return NextResponse.json({ error: "Nada para actualizar." }, { status: 400 });

  const order = await prisma.order.findUnique({ where: { publicId }, include: { items: true } });
  if (!order) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  // El precio de los pedidos de catálogo se calcula server-side desde los productos —
  // solo los pedidos personalizados (sin precio hasta coordinar) aceptan un total manual.
  if (total !== undefined && order.kind !== "Custom")
    return NextResponse.json(
      { error: "El precio de los pedidos de catálogo no se puede editar." },
      { status: 400 },
    );

  const finalStatus = status ?? order.status;
  const wasCancelled = order.status === "Cancelled";
  const willBeCancelled = finalStatus === "Cancelled";

  const updated = await prisma.$transaction(async (tx) => {
    // Solo los pedidos de catálogo (Stock) descuentan/reponen stock de productos.
    if (order.kind === "Stock" && wasCancelled !== willBeCancelled) {
      for (const item of order.items) {
        const delta = willBeCancelled ? { increment: item.quantity } : { decrement: item.quantity };
        // Al cancelar, se repone; si se reactiva un pedido cancelado, se vuelve a descontar
        // (puede dejar el stock en negativo si mientras tanto se vendió a otro cliente;
        // es una decisión consciente del admin, no se bloquea).
        await tx.product.updateMany({ where: { id: item.productId }, data: { stock: delta } });
        if (item.size) {
          await tx.productSize.updateMany({
            where: { productId: item.productId, size: item.size },
            data: { stock: delta },
          });
        }
      }
    }
    return tx.order.update({
      where: { publicId },
      data: {
        ...(status !== undefined ? { status } : {}),
        ...(total !== undefined ? { total } : {}),
        ...(trackingNumber !== undefined ? { trackingNumber: trackingNumber.trim() || null } : {}),
      },
    });
  });

  // Avisamos al comprador solo si el pago recién se confirma ahora (pedidos de catálogo).
  if (order.kind === "Stock" && status === "Paid" && order.status !== "Paid") {
    await sendPaymentConfirmation({
      publicId: updated.publicId,
      customerEmail: updated.customerEmail,
      customerName: updated.customerName,
      total: updated.total,
    }).catch(() => {});
  }

  // Avisamos al comprador cuando se carga (o cambia) el código de seguimiento.
  if (trackingNumber !== undefined && updated.trackingNumber && updated.trackingNumber !== order.trackingNumber) {
    await sendShippingNotification({
      publicId: updated.publicId,
      customerEmail: updated.customerEmail,
      customerName: updated.customerName,
      trackingNumber: updated.trackingNumber,
    }).catch(() => {});
  }

  return NextResponse.json({
    orderId: updated.publicId,
    status: updated.status,
    total: updated.total,
    trackingNumber: updated.trackingNumber,
  });
}
