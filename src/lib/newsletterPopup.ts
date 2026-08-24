import "server-only";
import { prisma } from "./prisma";

function formatDiscountLabel(coupon: { type: string; value: number }): string {
  return coupon.type === "percentage" ? `${coupon.value}% OFF` : `$${coupon.value.toLocaleString("es-AR")} OFF`;
}

export type NewsletterPopupPublic = {
  enabled: boolean;
  headline: string;
  subtext: string;
  discountLabel: string | null;
};

/** Config pública del pop-up: nunca expone el código del cupón, solo el valor del descuento a mostrar. */
export async function getNewsletterPopupPublic(): Promise<NewsletterPopupPublic> {
  const settings = await prisma.newsletterPopupSettings.findUnique({ where: { id: 1 } });
  if (!settings?.enabled || !settings.couponCode) {
    return { enabled: false, headline: "", subtext: "", discountLabel: null };
  }
  const coupon = await prisma.coupon.findUnique({ where: { code: settings.couponCode } });
  if (!coupon || !coupon.active) {
    return { enabled: false, headline: "", subtext: "", discountLabel: null };
  }
  return {
    enabled: true,
    headline: settings.headline,
    subtext: settings.subtext,
    discountLabel: formatDiscountLabel(coupon),
  };
}

/** Cupón vigente detrás del pop-up, para mandarlo por email al suscribirse. Null si no corresponde mandar nada. */
export async function getNewsletterPopupCoupon(): Promise<{ code: string; discountLabel: string } | null> {
  const settings = await prisma.newsletterPopupSettings.findUnique({ where: { id: 1 } });
  if (!settings?.enabled || !settings.couponCode) return null;

  const coupon = await prisma.coupon.findUnique({ where: { code: settings.couponCode } });
  if (!coupon || !coupon.active) return null;
  if (coupon.expiresAt && coupon.expiresAt.getTime() < Date.now()) return null;
  if (coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses) return null;

  return { code: coupon.code, discountLabel: formatDiscountLabel(coupon) };
}
