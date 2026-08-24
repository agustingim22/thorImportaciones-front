import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { CouponError, computeDiscount, findValidCoupon } from "@/lib/coupons";
import { rateLimit } from "@/lib/server/ratelimit";

/** Previsualiza si un cupón es válido para el carrito actual, sin aplicarlo todavía
 *  (se vuelve a validar y aplicar de forma atómica al crear el pedido). */
export async function POST(req: Request) {
  const limited = await rateLimit("coupon-validate", req, 20, 60);
  if (limited) return limited;

  const body = (await req.json()) as { code?: string; subtotal?: number };
  const subtotal = Number(body.subtotal);
  if (!body.code?.trim() || !Number.isFinite(subtotal) || subtotal < 0) {
    return NextResponse.json({ valid: false, error: "Datos inválidos." }, { status: 400 });
  }

  try {
    const coupon = await findValidCoupon(prisma, body.code, subtotal);
    const discountAmount = computeDiscount(coupon, subtotal);
    return NextResponse.json({
      valid: true,
      code: coupon.code,
      type: coupon.type,
      value: coupon.value,
      discountAmount,
    });
  } catch (err) {
    if (err instanceof CouponError) {
      return NextResponse.json({ valid: false, error: err.message }, { status: 400 });
    }
    throw err;
  }
}
