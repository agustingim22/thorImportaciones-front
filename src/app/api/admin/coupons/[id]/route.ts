import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { isAdmin } from "@/lib/server/auth";
import { serializeCoupon } from "@/lib/coupons";

type CouponInput = {
  code: string;
  type: "percentage" | "fixed";
  value: number;
  active: boolean;
  expiresAt: string | null;
  maxUses: number | null;
  minOrderValue: number | null;
};

function validate(input: CouponInput): Record<string, string[]> | null {
  const errors: Record<string, string[]> = {};
  if (!input.code?.trim()) errors.code = ["El código es obligatorio."];
  if (input.type !== "percentage" && input.type !== "fixed") {
    errors.type = ["Elegí un tipo de descuento válido."];
  }
  if (!Number.isInteger(input.value) || input.value <= 0) {
    errors.value = ["El valor debe ser un número entero mayor a 0."];
  } else if (input.type === "percentage" && input.value > 100) {
    errors.value = ["El porcentaje no puede ser mayor a 100."];
  }
  if (input.maxUses !== null && (!Number.isInteger(input.maxUses) || input.maxUses <= 0)) {
    errors.maxUses = ["El límite de usos debe ser un número entero mayor a 0, o dejarlo vacío."];
  }
  if (input.minOrderValue !== null && (!Number.isInteger(input.minOrderValue) || input.minOrderValue < 0)) {
    errors.minOrderValue = ["La compra mínima debe ser un número entero, o dejarlo vacío."];
  }
  return Object.keys(errors).length > 0 ? errors : null;
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!isAdmin(req)) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const { id } = await params;
  const couponId = Number(id);

  const existing = await prisma.coupon.findUnique({ where: { id: couponId } });
  if (!existing) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  const input = (await req.json()) as CouponInput;
  const errors = validate(input);
  if (errors) return NextResponse.json({ errors }, { status: 400 });

  try {
    const coupon = await prisma.coupon.update({
      where: { id: couponId },
      data: {
        code: input.code.trim().toUpperCase(),
        type: input.type,
        value: input.value,
        active: input.active,
        expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
        maxUses: input.maxUses,
        minOrderValue: input.minOrderValue,
      },
    });
    return NextResponse.json(serializeCoupon(coupon));
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return NextResponse.json({ errors: { code: ["Ya existe un cupón con ese código."] } }, { status: 400 });
    }
    throw err;
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!isAdmin(req)) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const { id } = await params;
  const couponId = Number(id);

  const existing = await prisma.coupon.findUnique({ where: { id: couponId } });
  if (!existing) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  await prisma.coupon.delete({ where: { id: couponId } });
  return new NextResponse(null, { status: 204 });
}
