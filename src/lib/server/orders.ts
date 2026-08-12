import "server-only";
import { prisma } from "../prisma";
import { getPayment } from "./mercadopago";
import { sendPaymentConfirmation } from "./email";

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

  // Solo avisamos si el pago recién se confirma ahora (MP puede reenviar el
  // mismo webhook varias veces; no queremos mandar el mail varias veces).
  if (newStatus === "Paid" && order.status !== "Paid") {
    await sendPaymentConfirmation({
      publicId: order.publicId,
      customerEmail: order.customerEmail,
      customerName: order.customerName,
      total: order.total,
    }).catch(() => {});
  }
}
