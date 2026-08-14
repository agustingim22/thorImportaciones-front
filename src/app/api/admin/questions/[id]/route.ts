import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdmin } from "@/lib/server/auth";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!isAdmin(req)) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const { id } = await params;
  const questionId = Number(id);

  const existing = await prisma.productQuestion.findUnique({ where: { id: questionId } });
  if (!existing) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  const { answer } = (await req.json()) as { answer?: string | null };
  const clean = answer?.trim() || null;

  const question = await prisma.productQuestion.update({
    where: { id: questionId },
    data: { answer: clean, answeredAt: clean ? new Date() : null },
  });
  return NextResponse.json(question);
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!isAdmin(req)) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const { id } = await params;
  const questionId = Number(id);

  const existing = await prisma.productQuestion.findUnique({ where: { id: questionId } });
  if (!existing) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  await prisma.productQuestion.delete({ where: { id: questionId } });
  return new NextResponse(null, { status: 204 });
}
