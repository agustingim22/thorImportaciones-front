import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getProductByIdOrSlug } from "@/lib/products";
import { sendAdminNewQuestion } from "@/lib/server/email";
import { rateLimit } from "@/lib/server/ratelimit";

type QuestionInput = { name?: string; question?: string };

export async function POST(req: Request, { params }: { params: Promise<{ idOrSlug: string }> }) {
  const limited = await rateLimit("product-question", req, 5, 10 * 60);
  if (limited) return limited;

  const { idOrSlug } = await params;
  const product = await getProductByIdOrSlug(idOrSlug);
  if (!product) return NextResponse.json({ error: "Producto no encontrado." }, { status: 404 });

  const input = (await req.json()) as QuestionInput;
  const errors: Record<string, string[]> = {};
  if (!input.name?.trim()) errors.name = ["Ingresá tu nombre."];
  if (!input.question?.trim()) errors.question = ["Escribí tu pregunta."];
  if (Object.keys(errors).length) return NextResponse.json({ errors }, { status: 400 });

  await prisma.productQuestion.create({
    data: { productId: product.id, name: input.name!.trim(), question: input.question!.trim() },
  });

  await sendAdminNewQuestion({
    productTeam: product.team,
    name: input.name!.trim(),
    question: input.question!.trim(),
  }).catch(() => {});

  return NextResponse.json({ ok: true }, { status: 201 });
}
