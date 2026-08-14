import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/server/session";
import { resolveCartItems } from "@/lib/server/cart";

/** Trae el carrito guardado del usuario, resuelto con precios/datos vigentes del producto. */
export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const rows = await prisma.savedCartItem.findMany({ where: { userId: user.id } });
  return NextResponse.json(await resolveCartItems(rows));
}

type CartItemInput = {
  productId: number;
  qty: number;
  size: string;
  customName?: string | null;
  customNumber?: string | null;
  patchId?: number | null;
};

/** Reemplaza el carrito guardado del usuario por el que manda el cliente. */
export async function PUT(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const body = (await req.json()) as { items?: CartItemInput[] };
  const items = Array.isArray(body.items) ? body.items : [];

  await prisma.$transaction([
    prisma.savedCartItem.deleteMany({ where: { userId: user.id } }),
    ...(items.length > 0
      ? [
          prisma.savedCartItem.createMany({
            data: items
              .filter((i) => Number.isInteger(i.productId) && Number.isInteger(i.qty) && i.qty > 0)
              .map((i) => ({
                userId: user.id,
                productId: i.productId,
                qty: i.qty,
                size: i.size ?? "",
                customName: i.customName || null,
                customNumber: i.customNumber || null,
                patchId: i.patchId ?? null,
              })),
          }),
        ]
      : []),
    // El carrito cambió: si estaba "abandonado" y esperando un recordatorio, arrancamos
    // el conteo de nuevo en vez de mandarle un mail sobre un carrito que ya no es ese.
    prisma.user.update({ where: { id: user.id }, data: { cartReminderSentAt: null } }),
  ]);

  return NextResponse.json({ ok: true });
}
