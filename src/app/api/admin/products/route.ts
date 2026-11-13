import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { PRODUCT_TYPES, type ProductType } from "@/lib/api";
import { matchClubsForSearch } from "@/lib/clubs";
import { isAdmin } from "@/lib/server/auth";
import { uniqueSlug } from "@/lib/server/slug";
import { serializeProduct, withPatches } from "@/lib/products";
import {
  toProductData,
  toSizeStockRows,
  validateProduct,
  type ProductInput,
} from "@/lib/server/productInput";

const DEFAULT_PAGE_SIZE = 50;
const MAX_PAGE_SIZE = 200;
// El desempate por id hace que el orden sea estable al paginar (muchos productos se cargan en el mismo instante).
const ORDER: Prisma.ProductOrderByWithRelationInput[] = [{ createdAt: "desc" }, { id: "desc" }];

/** Filtros del listado: `q` busca en el nombre y la URL del producto y, como en la búsqueda de la tienda, también
 *  entiende nombres de equipo ("real madrid" encuentra los "RMA"); `type` filtra por tipo de producto. */
function listFilter(url: URL): Prisma.ProductWhereInput {
  const q = (url.searchParams.get("q") ?? "").trim();
  const type = url.searchParams.get("type");
  const where: Prisma.ProductWhereInput = {};
  if (type && PRODUCT_TYPES.includes(type as ProductType)) where.type = type;
  if (q) {
    const clubs = matchClubsForSearch(q).map((c) => c.slug);
    where.OR = [
      { team: { contains: q, mode: "insensitive" } },
      { slug: { contains: q, mode: "insensitive" } },
      ...(clubs.length > 0 ? [{ club: { in: clubs } }] : []),
    ];
  }
  return where;
}

const intParam = (v: string | null, fallback: number) => {
  const n = Number(v);
  return v !== null && Number.isInteger(n) ? n : fallback;
};

/**
 * Sin `page`: devuelve TODOS los productos que coinciden con los filtros, como una lista (es lo que usa el botón
 * "Exportar a Excel" y cualquier script). Con `page` (y `pageSize`, hasta 200): devuelve esa página con el total,
 * que es lo que usa el panel para no bajar los ~5.000 productos cada vez que se abre.
 */
export async function GET(req: Request) {
  if (!isAdmin(req)) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const url = new URL(req.url);
  const where = listFilter(url);

  if (url.searchParams.get("page") === null) {
    const products = await prisma.product.findMany({ where, orderBy: ORDER, ...withPatches });
    return NextResponse.json(products.map((p) => serializeProduct(p)));
  }

  const pageSize = Math.min(MAX_PAGE_SIZE, Math.max(1, intParam(url.searchParams.get("pageSize"), DEFAULT_PAGE_SIZE)));
  const page = Math.max(1, intParam(url.searchParams.get("page"), 1));
  const [total, rows] = await Promise.all([
    prisma.product.count({ where }),
    prisma.product.findMany({ where, orderBy: ORDER, skip: (page - 1) * pageSize, take: pageSize, ...withPatches }),
  ]);
  return NextResponse.json({
    items: rows.map((p) => serializeProduct(p)),
    total,
    page,
    pageSize,
    pages: Math.max(1, Math.ceil(total / pageSize)),
  });
}

export async function POST(req: Request) {
  if (!isAdmin(req)) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const input = (await req.json()) as ProductInput;
  const errors = validateProduct(input);
  if (errors) return NextResponse.json({ errors }, { status: 400 });

  const slug = await uniqueSlug(input.slug?.trim() || input.team);
  const product = await prisma.product.create({
    data: {
      ...toProductData(input, slug),
      patches: {
        create: (input.patches ?? []).map((p) => ({
          label: p.label.trim(),
          imageUrl: p.imageUrl.trim(),
          extraPrice: p.extraPrice,
        })),
      },
      sizeStocks: { create: toSizeStockRows(input) },
    },
    ...withPatches,
  });
  revalidatePath("/");
  revalidatePath(`/producto/${product.slug}`);
  return NextResponse.json(serializeProduct(product), { status: 201 });
}
