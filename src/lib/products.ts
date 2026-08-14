import "server-only";
import { Prisma } from "@prisma/client";
import { prisma } from "./prisma";
import type { Product, ProductType } from "./api";

export const withPatches = Prisma.validator<Prisma.ProductDefaultArgs>()({
  include: { patches: { orderBy: { id: "asc" } }, sizeStocks: true },
});
type ProductRow = Prisma.ProductGetPayload<typeof withPatches>;

/** Única fuente de verdad para pasar una fila cruda de Prisma a la forma `Product` pública. */
export function serializeProduct(p: ProductRow, bestSellerIds: Set<number> = new Set()): Product {
  return {
    id: p.id,
    slug: p.slug,
    team: p.team,
    type: p.type as ProductType,
    price: p.price,
    salePrice: p.salePrice,
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
    isBestSeller: bestSellerIds.has(p.id),
  };
}

/** IDs de los productos más pedidos históricamente (pedidos no cancelados), para el badge "Más vendido". */
export async function getBestSellerIds(limit = 6): Promise<Set<number>> {
  const rows = await prisma.orderItem.groupBy({
    by: ["productId"],
    where: { order: { status: { not: "Cancelled" } } },
    _sum: { quantity: true },
    orderBy: { _sum: { quantity: "desc" } },
    take: limit,
  });
  return new Set(rows.map((r) => r.productId));
}

export type ProductSort = "newest" | "price-asc" | "price-desc";

export async function getProducts(
  params: {
    type?: ProductType;
    q?: string;
    minPrice?: number;
    maxPrice?: number;
    size?: string;
    sort?: ProductSort;
  } = {},
): Promise<Product[]> {
  const where: Prisma.ProductWhereInput = {};
  if (params.type) where.type = params.type;
  if (params.q) {
    where.OR = [
      { team: { contains: params.q, mode: "insensitive" } },
      { description: { contains: params.q, mode: "insensitive" } },
    ];
  }
  if (params.minPrice !== undefined || params.maxPrice !== undefined) {
    where.price = {};
    if (params.minPrice !== undefined) where.price.gte = params.minPrice;
    if (params.maxPrice !== undefined) where.price.lte = params.maxPrice;
  }
  if (params.size) {
    where.sizeStocks = { some: { size: params.size, stock: { gt: 0 } } };
  }
  const orderBy: Prisma.ProductOrderByWithRelationInput =
    params.sort === "price-asc"
      ? { price: "asc" }
      : params.sort === "price-desc"
        ? { price: "desc" }
        : { createdAt: "desc" };
  const [rows, bestSellerIds] = await Promise.all([
    prisma.product.findMany({ where, orderBy, ...withPatches }),
    getBestSellerIds(),
  ]);
  return rows.map((r) => serializeProduct(r, bestSellerIds));
}

/** Otras camisetas para mostrar como "también te puede interesar" en el detalle. */
export async function getRelatedProducts(
  product: Pick<Product, "id" | "type">,
  limit = 4,
): Promise<Product[]> {
  const bestSellerIds = await getBestSellerIds();
  const rows = await prisma.product.findMany({
    where: { id: { not: product.id }, type: product.type },
    orderBy: { createdAt: "desc" },
    take: limit,
    ...withPatches,
  });
  if (rows.length >= limit) return rows.map((r) => serializeProduct(r, bestSellerIds));

  // Si no hay suficientes del mismo tipo, completamos con otras camisetas.
  const fillerRows = await prisma.product.findMany({
    where: { id: { notIn: [product.id, ...rows.map((r) => r.id)] } },
    orderBy: { createdAt: "desc" },
    take: limit - rows.length,
    ...withPatches,
  });
  return [...rows, ...fillerRows].map((r) => serializeProduct(r, bestSellerIds));
}

export async function getProductByIdOrSlug(idOrSlug: string): Promise<Product | null> {
  const asId = Number(idOrSlug);
  const [row, bestSellerIds] = await Promise.all([
    Number.isInteger(asId) && String(asId) === idOrSlug
      ? prisma.product.findUnique({ where: { id: asId }, ...withPatches })
      : prisma.product.findUnique({ where: { slug: idOrSlug }, ...withPatches }),
    getBestSellerIds(),
  ]);
  return row ? serializeProduct(row, bestSellerIds) : null;
}
