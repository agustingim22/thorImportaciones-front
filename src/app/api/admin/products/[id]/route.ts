import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { isAdmin } from "@/lib/server/auth";
import { uniqueSlug } from "@/lib/server/slug";
import { serializeProduct, withPatches } from "@/lib/products";
import { sendStockBackNotification } from "@/lib/server/email";
import { checkFavoriteStockCrossing } from "@/lib/favoriteWatch";
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

  // Si el producto pasó de "sin stock" a "con stock", avisamos a quien lo pidió.
  if (existing.stock <= 0 && product.stock > 0) {
    const pending = await prisma.stockNotification.findMany({
      where: { productId, notified: false },
    });
    if (pending.length > 0) {
      await Promise.all(
        pending.map((n) =>
          sendStockBackNotification({ email: n.email, team: product.team, slug: product.slug }).catch(
            () => {},
          ),
        ),
      );
      await prisma.stockNotification.updateMany({
        where: { productId, notified: false },
        data: { notified: true },
      });
    }
  }

  checkFavoriteStockCrossing(product.id, existing.stock, product.stock).catch(() => {});

  revalidatePath("/");
  revalidatePath(`/producto/${product.slug}`);
  if (slug !== existing.slug) revalidatePath(`/producto/${existing.slug}`);
  return NextResponse.json(serializeProduct(product));
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!isAdmin(req)) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const { id } = await params;
  const productId = Number(id);

  const existing = await prisma.product.findUnique({ where: { id: productId } });
  if (!existing) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  await prisma.product.delete({ where: { id: productId } });
  revalidatePath("/");
  revalidatePath(`/producto/${existing.slug}`);
  return new NextResponse(null, { status: 204 });
}
