import "server-only";
import { Prisma } from "@prisma/client";
import { prisma } from "./prisma";
import type { Product, ProductType } from "./api";

export const withPatches = Prisma.validator<Prisma.ProductDefaultArgs>()({
  include: { patches: { orderBy: { id: "asc" } }, sizeStocks: true },
});
type ProductRow = Prisma.ProductGetPayload<typeof withPatches>;

/** Única fuente de verdad para pasar una fila cruda de Prisma a la forma `Product` pública. */
export function serializeProduct(p: ProductRow): Product {
  return {
    id: p.id,
    slug: p.slug,
    team: p.team,
    type: p.type as ProductType,
    price: p.price,
    colorCss: p.colorCss,
    images: p.images,
    imageUrl: p.images[0] ?? null,
    description: p.description,
    stock: p.stock,
    inStock: p.stock > 0,
    presetName: p.presetName,
    presetNumber: p.presetNumber,
    sizes: p.sizes,
    sizeStock: Object.fromEntries(p.sizeStocks.map((s) => [s.size, s.stock])),
    patches: p.patches.map((patch) => ({
      id: patch.id,
      label: patch.label,
      imageUrl: patch.imageUrl,
      extraPrice: patch.extraPrice,
    })),
    createdAt: p.createdAt.toISOString(),
  };
}

export async function getProducts(
  params: { type?: ProductType; q?: string } = {},
): Promise<Product[]> {
  const where: Prisma.ProductWhereInput = {};
  if (params.type) where.type = params.type;
  if (params.q) {
    where.OR = [
      { team: { contains: params.q, mode: "insensitive" } },
      { description: { contains: params.q, mode: "insensitive" } },
    ];
  }
  const rows = await prisma.product.findMany({
    where,
    orderBy: { createdAt: "desc" },
    ...withPatches,
  });
  return rows.map(serializeProduct);
}

/** Otras camisetas para mostrar como "también te puede interesar" en el detalle. */
export async function getRelatedProducts(
  product: Pick<Product, "id" | "type">,
  limit = 4,
): Promise<Product[]> {
  const rows = await prisma.product.findMany({
    where: { id: { not: product.id }, type: product.type },
    orderBy: { createdAt: "desc" },
    take: limit,
    ...withPatches,
  });
  if (rows.length >= limit) return rows.map(serializeProduct);

  // Si no hay suficientes del mismo tipo, completamos con otras camisetas.
  const fillerRows = await prisma.product.findMany({
    where: { id: { notIn: [product.id, ...rows.map((r) => r.id)] } },
    orderBy: { createdAt: "desc" },
    take: limit - rows.length,
    ...withPatches,
  });
  return [...rows, ...fillerRows].map(serializeProduct);
}

export async function getProductByIdOrSlug(idOrSlug: string): Promise<Product | null> {
  const asId = Number(idOrSlug);
  const row =
    Number.isInteger(asId) && String(asId) === idOrSlug
      ? await prisma.product.findUnique({ where: { id: asId }, ...withPatches })
      : await prisma.product.findUnique({ where: { slug: idOrSlug }, ...withPatches });
  return row ? serializeProduct(row) : null;
}
