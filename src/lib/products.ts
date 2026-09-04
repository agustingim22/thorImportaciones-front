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

export const DEFAULT_PAGE_SIZE = 24;

export type ProductsPage = { products: Product[]; total: number };

/** Con el catálogo en miles de productos, siempre pagina (page 1-based) —
 *  nunca trae todo de una, para no tumbar la página ni el payload. */
export async function getProducts(
  params: {
    ids?: number[];
    type?: ProductType;
    q?: string;
    minPrice?: number;
    maxPrice?: number;
    size?: string;
    sort?: ProductSort;
    page?: number;
    pageSize?: number;
  } = {},
): Promise<ProductsPage> {
  const where: Prisma.ProductWhereInput = {};
  if (params.ids) where.id = { in: params.ids };
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
  const pageSize = params.pageSize ?? (params.ids ? Math.max(params.ids.length, 1) : DEFAULT_PAGE_SIZE);
  const page = Math.max(1, params.page ?? 1);
  const [rows, total, bestSellerIds] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize,
      ...withPatches,
    }),
    prisma.product.count({ where }),
    getBestSellerIds(),
  ]);
  return { products: rows.map((r) => serializeProduct(r, bestSellerIds)), total };
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

/** Slugs de los productos más recientes, para prerenderizar /producto/[slug] en el
 *  build (ISR). Con miles de productos no tiene sentido (ni conviene) prerenderizar
 *  todos: el resto se genera on-demand en la primera visita y queda cacheado igual. */
export async function getAllProductSlugs(limit = 50): Promise<string[]> {
  const rows = await prisma.product.findMany({
    select: { slug: true },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
  return rows.map((r) => r.slug);
}

/** Slug + fecha de TODOS los productos, para el sitemap. A diferencia de
 *  getProducts(), no trae parches/talles/más-vendidos: el sitemap solo necesita
 *  la URL y la fecha de cada uno, así que evita esa consulta pesada por completo. */
export async function getSitemapProducts(): Promise<{ slug: string; createdAt: Date }[]> {
  return prisma.product.findMany({ select: { slug: true, createdAt: true } });
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
