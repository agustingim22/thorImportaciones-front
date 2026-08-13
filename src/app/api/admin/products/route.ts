import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdmin } from "@/lib/server/auth";
import { uniqueSlug } from "@/lib/server/slug";
import { serializeProduct, withPatches } from "@/lib/products";
import {
  toProductData,
  toSizeStockRows,
  validateProduct,
  type ProductInput,
} from "@/lib/server/productInput";

export async function GET(req: Request) {
  if (!isAdmin(req)) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const products = await prisma.product.findMany({
    orderBy: { createdAt: "desc" },
    ...withPatches,
  });
  return NextResponse.json(products.map(serializeProduct));
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
  return NextResponse.json(serializeProduct(product), { status: 201 });
}
