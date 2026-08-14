import "server-only";
import { prisma } from "@/lib/prisma";
import type { SavedCartItem } from "@prisma/client";

export type ResolvedCartItem = {
  productId: number;
  team: string;
  slug: string;
  price: number;
  qty: number;
  imageUrl: string | null;
  colorCss: string;
  presetNumber: string | null;
  size: string;
  customName: string | null;
  customNumber: string | null;
  patchId: number | null;
  patchLabel: string | null;
  patchExtraPrice: number;
};

/** Resuelve filas de SavedCartItem con los datos vigentes del producto (precio, foto, etc). */
export async function resolveCartItems(rows: SavedCartItem[]): Promise<ResolvedCartItem[]> {
  if (rows.length === 0) return [];

  const products = await prisma.product.findMany({
    where: { id: { in: rows.map((r) => r.productId) } },
    include: { patches: true },
  });
  const byId = new Map(products.map((p) => [p.id, p]));

  return rows
    .map((r): ResolvedCartItem | null => {
      const product = byId.get(r.productId);
      if (!product) return null; // el producto ya no existe: se descarta
      const patch = r.patchId != null ? product.patches.find((p) => p.id === r.patchId) : undefined;
      return {
        productId: product.id,
        team: product.team,
        slug: product.slug,
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
    .filter((x): x is ResolvedCartItem => x !== null);
}
