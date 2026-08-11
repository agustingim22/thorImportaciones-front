import "server-only";
import { Prisma, type Product as PrismaProduct } from "@prisma/client";
import { prisma } from "./prisma";
import type { Product } from "./api";

function serialize(p: PrismaProduct): Product {
  return { ...p, type: p.type as Product["type"], createdAt: p.createdAt.toISOString() };
}

export async function getProducts(
  params: { type?: "retro" | "player"; q?: string } = {},
): Promise<Product[]> {
  const where: Prisma.ProductWhereInput = {};
  if (params.type) where.type = params.type;
  if (params.q) {
    where.OR = [
      { team: { contains: params.q, mode: "insensitive" } },
      { description: { contains: params.q, mode: "insensitive" } },
    ];
  }
  const rows = await prisma.product.findMany({ where, orderBy: { createdAt: "desc" } });
  return rows.map(serialize);
}

export async function getProductByIdOrSlug(idOrSlug: string): Promise<Product | null> {
  const asId = Number(idOrSlug);
  const row =
    Number.isInteger(asId) && String(asId) === idOrSlug
      ? await prisma.product.findUnique({ where: { id: asId } })
      : await prisma.product.findUnique({ where: { slug: idOrSlug } });
  return row ? serialize(row) : null;
}
