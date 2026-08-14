import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendCartReminder } from "@/lib/server/email";
import { resolveCartItems } from "@/lib/server/cart";

/** Horas sin tocar el carrito antes de considerarlo abandonado. */
const ABANDON_HOURS = 24;

/** Vercel Cron llama esto con Authorization: Bearer $CRON_SECRET. */
export async function GET(req: Request) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const cutoff = new Date(Date.now() - ABANDON_HOURS * 60 * 60 * 1000);
  const users = await prisma.user.findMany({
    where: {
      cartReminderSentAt: null,
      savedCartItems: { some: { createdAt: { lte: cutoff } } },
    },
    include: { savedCartItems: true },
  });

  let sent = 0;
  for (const user of users) {
    const items = await resolveCartItems(user.savedCartItems);
    if (user.email && items.length > 0) {
      await sendCartReminder({
        email: user.email,
        customerName: user.name,
        items: items.map((i) => ({ team: i.team, qty: i.qty })),
      }).catch(() => {});
      sent++;
    }
    // Se marca como procesado igual, para no reintentar todos los días.
    await prisma.user.update({ where: { id: user.id }, data: { cartReminderSentAt: new Date() } });
  }

  return NextResponse.json({ ok: true, checked: users.length, sent });
}
