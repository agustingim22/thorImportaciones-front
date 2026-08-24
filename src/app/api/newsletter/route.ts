import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/server/ratelimit";
import { getNewsletterPopupCoupon } from "@/lib/newsletterPopup";
import { sendNewsletterCoupon } from "@/lib/server/email";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: Request) {
  const limited = await rateLimit("newsletter", req, 5, 10 * 60);
  if (limited) return limited;

  const { email, wantsCoupon } = (await req.json()) as { email?: string; wantsCoupon?: boolean };
  const clean = email?.trim().toLowerCase() ?? "";
  if (!EMAIL_RE.test(clean))
    return NextResponse.json({ error: "Ingresá un email válido." }, { status: 400 });

  await prisma.subscriber.upsert({
    where: { email: clean },
    create: { email: clean },
    update: {},
  });

  // El pop-up de la home pide el cupón de bienvenida vigente y lo manda por mail
  // (no se le muestra el código en pantalla, solo llega si dejó un email real).
  if (wantsCoupon) {
    const coupon = await getNewsletterPopupCoupon();
    if (coupon) {
      await sendNewsletterCoupon({ email: clean, code: coupon.code, discountLabel: coupon.discountLabel }).catch(
        () => {},
      );
    }
  }

  return NextResponse.json({ ok: true }, { status: 201 });
}
