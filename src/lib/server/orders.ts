import "server-only";
import { prisma } from "../prisma";
import { getPayment } from "./mercadopago";

/** Consulta el pago en MP y actualiza el pedido correspondiente. */
export async function applyPayment(paymentId: string): Promise<void> {
  const { status, externalReference } = await getPayment(paymentId);
  if (!externalReference) return;

  const order = await prisma.order.findUnique({ where: { publicId: externalReference } });
  if (!order) return;

  const newStatus =
    status === "approved"
      ? "Paid"
      : status === "cancelled" || status === "rejected"
        ? "Cancelled"
        : order.status;

  await prisma.order.update({
    where: { id: order.id },
    data: { paymentId, status: newStatus },
  });
}
