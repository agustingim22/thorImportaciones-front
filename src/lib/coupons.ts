import "server-only";
import type { Prisma, PrismaClient } from "@prisma/client";
import { prisma } from "./prisma";

export type CouponType = "percentage" | "fixed";

export type Coupon = {
  id: number;
  code: string;
  type: CouponType;
  value: number;
  active: boolean;
  expiresAt: string | null;
  maxUses: number | null;
  usedCount: number;
  minOrderValue: number | null;
  createdAt: string;
};

type CouponRow = Awaited<ReturnType<typeof prisma.coupon.findUnique>>;

export function serializeCoupon(c: NonNullable<CouponRow>): Coupon {
  return {
    id: c.id,
    code: c.code,
    type: c.type as CouponType,
    value: c.value,
    active: c.active,
    expiresAt: c.expiresAt ? c.expiresAt.toISOString() : null,
    maxUses: c.maxUses,
    usedCount: c.usedCount,
    minOrderValue: c.minOrderValue,
    createdAt: c.createdAt.toISOString(),
  };
}

/** Error de validación de negocio del cupón — se traduce a 400 en los endpoints. */
export class CouponError extends Error {}

type Db = PrismaClient | Prisma.TransactionClient;

/** Busca un cupón por código y valida que se pueda usar para el subtotal dado. Tira CouponError si no aplica. */
export async function findValidCoupon(db: Db, rawCode: string, subtotal: number) {
  const code = rawCode.trim().toUpperCase();
  if (!code) throw new CouponError("Ingresá un código de cupón.");

  const coupon = await db.coupon.findUnique({ where: { code } });
  if (!coupon || !coupon.active) throw new CouponError("Ese cupón no existe o ya no está activo.");
  if (coupon.expiresAt && coupon.expiresAt.getTime() < Date.now()) {
    throw new CouponError("Ese cupón venció.");
  }
  if (coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses) {
    throw new CouponError("Ese cupón alcanzó el límite de usos.");
  }
  if (coupon.minOrderValue !== null && subtotal < coupon.minOrderValue) {
    throw new CouponError(
      `Ese cupón requiere una compra mínima de $${coupon.minOrderValue.toLocaleString("es-AR")}.`,
    );
  }
  return coupon;
}

/** Monto a descontar (nunca más que el subtotal, para que el total no quede negativo). */
export function computeDiscount(coupon: { type: string; value: number }, subtotal: number): number {
  const raw = coupon.type === "percentage" ? Math.round((subtotal * coupon.value) / 100) : coupon.value;
  return Math.max(0, Math.min(raw, subtotal));
}
