import "server-only";
import { Prisma } from "@prisma/client";
import { prisma } from "./prisma";
import type { Product, ProductType } from "./api";

const withPatches = Prisma.validator<Prisma.ProductDefaultArgs>()({
  include: { patches: { orderBy: { id: "asc" } } },
});
type ProductRow = Prisma.ProductGetPayload<typeof withPatches>;

function serialize(p: ProductRow): Product {
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
    inStock: p.inStock,
    presetName: p.presetName,
    presetNumber: p.presetNumber,
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
  return rows.map(serialize);
}

export async function getProductByIdOrSlug(idOrSlug: string): Promise<Product | null> {
  const asId = Number(idOrSlug);
  const row =
    Number.isInteger(asId) && String(asId) === idOrSlug
      ? await prisma.product.findUnique({ where: { id: asId }, ...withPatches })
      : await prisma.product.findUnique({ where: { slug: idOrSlug }, ...withPatches });
  return row ? serialize(row) : null;
}
