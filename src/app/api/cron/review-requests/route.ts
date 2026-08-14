import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendReviewRequest } from "@/lib/server/email";

/** Días de margen desde la entrega antes de pedir la reseña. */
const REVIEW_REQUEST_DELAY_DAYS = 4;

/** Vercel Cron llama esto con Authorization: Bearer $CRON_SECRET. */
export async function GET(req: Request) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const cutoff = new Date(Date.now() - REVIEW_REQUEST_DELAY_DAYS * 24 * 60 * 60 * 1000);
  const orders = await prisma.order.findMany({
    where: {
      kind: "Stock",
      status: "Delivered",
      deliveredAt: { lte: cutoff },
      reviewRequestSentAt: null,
    },
    include: { items: true },
  });

  let sent = 0;
  for (const order of orders) {
    const productIds = Array.from(new Set(order.items.map((i) => i.productId)));
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { team: true, slug: true },
    });
    if (order.customerEmail && products.length > 0) {
      await sendReviewRequest({
        email: order.customerEmail,
        customerName: order.customerName,
        products,
      }).catch(() => {});
      sent++;
    }
    // Se marca como procesado igual, aunque no tuviera email o los productos ya no
    // existan — para no reintentar ese pedido todos los días.
    await prisma.order.update({ where: { id: order.id }, data: { reviewRequestSentAt: new Date() } });
  }

  return NextResponse.json({ ok: true, checked: orders.length, sent });
}
