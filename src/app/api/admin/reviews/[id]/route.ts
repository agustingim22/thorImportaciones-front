import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdmin } from "@/lib/server/auth";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!isAdmin(req)) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const { id } = await params;
  const reviewId = Number(id);

  const existing = await prisma.review.findUnique({ where: { id: reviewId } });
  if (!existing) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  const { published } = (await req.json()) as { published?: boolean };
  if (typeof published !== "boolean")
    return NextResponse.json({ error: "Falta el campo published." }, { status: 400 });

  const review = await prisma.review.update({ where: { id: reviewId }, data: { published } });
  return NextResponse.json(review);
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!isAdmin(req)) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const { id } = await params;
  const reviewId = Number(id);

  const existing = await prisma.review.findUnique({ where: { id: reviewId } });
  if (!existing) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  await prisma.review.delete({ where: { id: reviewId } });
  return new NextResponse(null, { status: 204 });
}
