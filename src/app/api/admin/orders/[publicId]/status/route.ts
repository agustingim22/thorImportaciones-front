import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdmin } from "@/lib/server/auth";

const VALID = ["Pending", "Paid", "Cancelled", "Delivered"];

export async function POST(req: Request, { params }: { params: Promise<{ publicId: string }> }) {
  if (!isAdmin(req)) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const { publicId } = await params;
  const { status } = (await req.json()) as { status?: string };

  if (!status || !VALID.includes(status))
    return NextResponse.json({ error: "Estado inválido." }, { status: 400 });

  const order = await prisma.order.findUnique({ where: { publicId }, include: { items: true } });
  if (!order) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  const wasCancelled = order.status === "Cancelled";
  const willBeCancelled = status === "Cancelled";

  const updated = await prisma.$transaction(async (tx) => {
    // Solo los pedidos de catálogo (Stock) descuentan/reponen stock de productos.
    if (order.kind === "Stock" && wasCancelled !== willBeCancelled) {
      for (const item of order.items) {
        await tx.product.updateMany({
          where: { id: item.productId },
          data: {
            // Al cancelar, se repone; si se reactiva un pedido cancelado, se vuelve a descontar
            // (puede dejar el stock en negativo si mientras tanto se vendió a otro cliente;
            // es una decisión consciente del admin, no se bloquea).
            stock: willBeCancelled ? { increment: item.quantity } : { decrement: item.quantity },
          },
        });
      }
    }
    return tx.order.update({ where: { publicId }, data: { status } });
  });

  return NextResponse.json({ orderId: updated.publicId, status: updated.status });
}
