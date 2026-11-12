import "server-only";
import { unstable_cache } from "next/cache";
import { Prisma } from "@prisma/client";
import { prisma } from "./prisma";
import type { Product, ProductType } from "./api";
import { HOME_TEAM_SLUGS, getClubBySlug, matchClubsForSearch } from "./clubs";
import { displayName, searchEquivalents } from "./displayName";
import { GROUP_SIZE } from "./ranking";

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
    name: displayName(p.team, p.type),
    club: p.club,
    clubManual: p.clubManual,
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

/** IDs de los productos más pedidos históricamente (pedidos no cancelados), en orden. */
async function fetchBestSellerIds(limit: number): Promise<number[]> {
  const rows = await prisma.orderItem.groupBy({
    by: ["productId"],
    where: { order: { status: { not: "Cancelled" } } },
    _sum: { quantity: true },
    orderBy: { _sum: { quantity: "desc" } },
    take: limit,
  });
  return rows.map((r) => r.productId);
}
// Cacheado 5 min: es una agregación sobre todos los pedidos y se hacía en CADA consulta del catálogo.
const cachedBestSellerIds = unstable_cache(fetchBestSellerIds, ["best-seller-ids"], { revalidate: 300 });

/** Para el badge "Más vendido". */
export async function getBestSellerIds(limit = 6): Promise<Set<number>> {
  return new Set(await cachedBestSellerIds(limit));
}

/** "featured" es el orden por defecto (ver lib/ranking.ts): camisetas de equipos destacados primero. */
export type ProductSort = "featured" | "newest" | "price-asc" | "price-desc";

export const DEFAULT_PAGE_SIZE = 24;

export type ProductsPage = { products: Product[]; total: number };

type GetProductsParams = {
  ids?: number[];
  type?: ProductType;
  club?: string; // slug de un club destacado (ver lib/clubs.ts)
  q?: string;
  minPrice?: number;
  maxPrice?: number;
  size?: string;
  sort?: ProductSort;
  page?: number;
  pageSize?: number;
};

/** Con el catálogo en miles de productos, siempre pagina (page 1-based) —
 *  nunca trae todo de una, para no tumbar la página ni el payload. */
async function fetchProducts(params: GetProductsParams = {}): Promise<ProductsPage> {
  const where: Prisma.ProductWhereInput = {};
  if (params.ids) where.id = { in: params.ids };
  if (params.type) where.type = params.type;
  if (params.club) where.club = params.club;
  if (params.q) {
    // La búsqueda entiende equipos: "real madrid", "rma" o "brasil" traen también los productos
    // del equipo aunque el título del proveedor use otra sigla o esté en inglés ("Brazil").
    // Y los países en español ("noruega") buscan también su nombre en inglés ("norway").
    const clubSlugs = matchClubsForSearch(params.q).map((c) => c.slug);
    const terms = [params.q, ...searchEquivalents(params.q)];
    where.OR = [
      ...terms.map((t) => ({ team: { contains: t, mode: "insensitive" as const } })),
      { description: { contains: params.q, mode: "insensitive" as const } },
      ...(clubSlugs.length > 0 ? [{ club: { in: clubSlugs } }] : []),
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
  const orderBy: Prisma.ProductOrderByWithRelationInput | Prisma.ProductOrderByWithRelationInput[] =
    params.sort === "price-asc"
      ? { price: "asc" }
      : params.sort === "price-desc"
        ? { price: "desc" }
        : params.sort === "newest"
          ? { createdAt: "desc" }
          : [{ rank: "asc" }, { createdAt: "desc" }]; // "featured" (por defecto)
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

/** El catálogo lee `searchParams`, así que Next siempre renderiza /catalogo por
 *  request sin importar ningún `revalidate` de la página — pero la consulta en
 *  sí (la parte cara: findMany + count + agregado de más-vendidos sobre miles
 *  de filas) se puede cachear igual acá, por combinación de filtros, y así no
 *  pegarle a la base en cada clic dentro del catálogo. El admin no pasa por
 *  acá (tiene su propia consulta directa), así que una edición de precio/stock
 *  se ve al instante ahí; en el resto del sitio tarda hasta 60s en reflejarse,
 *  igual que ya pasa con la ficha de producto. */
export const getProducts = unstable_cache(fetchProducts, ["products-list"], {
  revalidate: 60,
});

/** Cuántos productos tiene cada equipo destacado (slug → cantidad), para mostrar solo los
 *  que tienen stock en el filtro del catálogo. Es una agrupación sobre una columna
 *  indexada; se cachea 60s, igual que getProducts, para que después de reclasificar
 *  (o cargar productos) los números no queden desfasados de la grilla. */
async function fetchClubCounts(): Promise<Record<string, number>> {
  const rows = await prisma.product.groupBy({
    by: ["club"],
    where: { club: { not: null } },
    _count: { _all: true },
  });
  return Object.fromEntries(rows.map((r) => [r.club as string, r._count._all]));
}
export const getClubCounts = unstable_cache(fetchClubCounts, ["club-counts"], { revalidate: 60 });

export type TeamShowcaseItem = { slug: string; name: string; imageUrl: string; count: number };

/** Para el bloque "Comprá por equipo" de la portada: por cada equipo, la foto de su camiseta más
 *  nueva con stock (solo camisetas, no shorts) y cuántos productos tiene. Cacheado 5 min. */
export const getTeamShowcase = unstable_cache(
  async (): Promise<TeamShowcaseItem[]> => {
    const counts = await fetchClubCounts();
    const items = await Promise.all(
      HOME_TEAM_SLUGS.map(async (slug): Promise<TeamShowcaseItem | null> => {
        const club = getClubBySlug(slug);
        if (!club || !(counts[slug] > 0)) return null;
        const row = await prisma.product.findFirst({
          where: { club: slug, type: { in: ["fan", "player", "retro"] }, stock: { gt: 0 }, images: { isEmpty: false } },
          orderBy: [{ rank: "asc" }, { createdAt: "desc" }], // la foto de la mejor camiseta del equipo
          select: { images: true },
        });
        const imageUrl = row?.images[0];
        return imageUrl ? { slug, name: club.name, imageUrl, count: counts[slug] } : null;
      }),
    );
    return items.filter((x): x is TeamShowcaseItem => x !== null);
  },
  ["team-showcase"],
  { revalidate: 300 },
);

/** Otras camisetas para mostrar en el detalle: primero más del mismo equipo, después del mismo
 *  tipo, y si todavía faltan, las más nuevas. */
export async function getRelatedProducts(
  product: Pick<Product, "id" | "type" | "club">,
  limit = 4,
): Promise<Product[]> {
  const bestSellerIds = await getBestSellerIds();
  const picked: ProductRow[] = [];
  const pull = async (where: Prisma.ProductWhereInput) => {
    const need = limit - picked.length;
    if (need <= 0) return;
    const rows = await prisma.product.findMany({
      where: { AND: [where, { id: { notIn: [product.id, ...picked.map((r) => r.id)] } }] },
      orderBy: [{ rank: "asc" }, { createdAt: "desc" }],
      take: need,
      ...withPatches,
    });
    picked.push(...rows);
  };
  if (product.club) await pull({ club: product.club });
  await pull({ type: product.type });
  await pull({});
  return picked.map((r) => serializeProduct(r, bestSellerIds));
}

export type FeaturedProducts = { products: Product[]; fromOrders: number };

async function fetchFeaturedProducts(limit: number): Promise<FeaturedProducts> {
  const bestIds = await fetchBestSellerIds(12);
  const bestRows =
    bestIds.length > 0
      ? await prisma.product.findMany({ where: { id: { in: bestIds }, stock: { gt: 0 } }, ...withPatches })
      : [];
  const picked: ProductRow[] = bestIds
    .map((id) => bestRows.find((r) => r.id === id))
    .filter((r): r is ProductRow => !!r)
    .slice(0, limit);
  const fromOrders = picked.length;

  // Si no alcanzan los realmente más pedidos, se completa con la camiseta más nueva de cada uno de
  // los equipos principales (Boca, River, Argentina…), en vez de mostrar lo último que se importó.
  for (const slug of HOME_TEAM_SLUGS) {
    if (picked.length >= limit) break;
    const row = await prisma.product.findFirst({
      where: {
        club: slug,
        rank: { lt: GROUP_SIZE }, // grupo 0: camisetas de equipos destacados
        stock: { gt: 0 },
        images: { isEmpty: false },
        id: { notIn: picked.map((r) => r.id) },
      },
      orderBy: [{ rank: "asc" }, { createdAt: "desc" }], // la mejor camiseta del equipo (temporada nueva, Local)
      ...withPatches,
    });
    if (row) picked.push(row);
  }
  // Catálogo todavía sin clasificar: las primeras del orden "Destacados".
  if (picked.length < limit) {
    const rest = await prisma.product.findMany({
      where: { stock: { gt: 0 }, id: { notIn: picked.map((r) => r.id) } },
      orderBy: [{ rank: "asc" }, { createdAt: "desc" }],
      take: limit - picked.length,
      ...withPatches,
    });
    picked.push(...rest);
  }
  const badge = new Set(bestIds.slice(0, 6));
  return { products: picked.map((r) => serializeProduct(r, badge)), fromOrders };
}

/** Para "Lo más pedido" / "Destacados" de la portada. `fromOrders` = cuántos salen de pedidos reales. */
export const getFeaturedProducts = unstable_cache(fetchFeaturedProducts, ["featured-products"], {
  revalidate: 300,
});

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
export const getSitemapProducts = unstable_cache(
  async (): Promise<{ slug: string; createdAt: string }[]> => {
    const rows = await prisma.product.findMany({ select: { slug: true, createdAt: true } });
    return rows.map((r) => ({ slug: r.slug, createdAt: r.createdAt.toISOString() }));
  },
  ["sitemap-products"],
  // Cacheado 1 h: con 5.000 productos la consulta tardaba ~3,5 s en cada visita de un buscador.
  { revalidate: 3600 },
);

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
