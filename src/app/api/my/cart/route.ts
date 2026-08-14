import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/server/session";

/** Trae el carrito guardado del usuario, resuelto con precios/datos vigentes del producto. */
export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const rows = await prisma.savedCartItem.findMany({ where: { userId: user.id } });
  if (rows.length === 0) return NextResponse.json([]);

  const products = await prisma.product.findMany({
    where: { id: { in: rows.map((r) => r.productId) } },
    include: { patches: true },
  });
  const byId = new Map(products.map((p) => [p.id, p]));

  const items = rows
    .map((r) => {
      const product = byId.get(r.productId);
      if (!product) return null; // el producto ya no existe: se descarta
      const patch = r.patchId != null ? product.patches.find((p) => p.id === r.patchId) : undefined;
      return {
        productId: product.id,
        team: product.team,
        price: product.price,
        qty: r.qty,
        imageUrl: product.images[0] ?? null,
        colorCss: product.colorCss,
        presetNumber: product.presetNumber,
        size: r.size,
        customName: r.customName,
        customNumber: r.customNumber,
        patchId: patch?.id ?? null,
        patchLabel: patch?.label ?? null,
        patchExtraPrice: patch?.extraPrice ?? 0,
      };
    })
    .filter((x) => x !== null);

  return NextResponse.json(items);
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
  ]);

  return NextResponse.json({ ok: true });
}
