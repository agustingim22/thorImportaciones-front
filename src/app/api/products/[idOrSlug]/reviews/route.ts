import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getProductByIdOrSlug } from "@/lib/products";
import { rateLimit } from "@/lib/server/ratelimit";

type ReviewInput = { name?: string; rating?: number; comment?: string };

export async function POST(req: Request, { params }: { params: Promise<{ idOrSlug: string }> }) {
  const limited = await rateLimit("product-review", req, 5, 10 * 60);
  if (limited) return limited;

  const { idOrSlug } = await params;
  const product = await getProductByIdOrSlug(idOrSlug);
  if (!product) return NextResponse.json({ error: "Producto no encontrado." }, { status: 404 });

  const input = (await req.json()) as ReviewInput;
  const errors: Record<string, string[]> = {};
  if (!input.name?.trim()) errors.name = ["Ingresá tu nombre."];
  if (!input.comment?.trim()) errors.comment = ["Ingresá tu comentario."];
  if (!Number.isInteger(input.rating) || (input.rating as number) < 1 || (input.rating as number) > 5) {
    errors.rating = ["Elegí un puntaje de 1 a 5."];
  }
  if (Object.keys(errors).length) return NextResponse.json({ errors }, { status: 400 });

  await prisma.review.create({
    data: {
      productId: product.id,
      name: input.name!.trim(),
      rating: input.rating!,
      comment: input.comment!.trim(),
      published: false,
    },
  });

  return NextResponse.json({ ok: true }, { status: 201 });
}
