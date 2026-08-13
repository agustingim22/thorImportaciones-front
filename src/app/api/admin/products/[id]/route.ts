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

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!isAdmin(req)) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const { id } = await params;
  const productId = Number(id);

  const existing = await prisma.product.findUnique({ where: { id: productId } });
  if (!existing) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  const input = (await req.json()) as ProductInput;
  const errors = validateProduct(input);
  if (errors) return NextResponse.json({ errors }, { status: 400 });

  // Si cambian el slug, lo re-generamos único
  let slug = existing.slug;
  if (input.slug?.trim() && input.slug.trim() !== existing.slug) {
    slug = await uniqueSlug(input.slug, existing.id);
  }

  // Reemplazamos los parches por completo (más simple que hacer diff con los existentes)
  const [product] = await prisma.$transaction([
    prisma.product.update({
      where: { id: productId },
      data: {
        ...toProductData(input, slug),
        patches: {
          deleteMany: {},
          create: (input.patches ?? []).map((p) => ({
            label: p.label.trim(),
            imageUrl: p.imageUrl.trim(),
            extraPrice: p.extraPrice,
          })),
        },
        sizeStocks: {
          deleteMany: {},
          create: toSizeStockRows(input),
        },
      },
      ...withPatches,
    }),
  ]);
  return NextResponse.json(serializeProduct(product));
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!isAdmin(req)) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const { id } = await params;
  const productId = Number(id);

  const existing = await prisma.product.findUnique({ where: { id: productId } });
  if (!existing) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  await prisma.product.delete({ where: { id: productId } });
  return new NextResponse(null, { status: 204 });
}
