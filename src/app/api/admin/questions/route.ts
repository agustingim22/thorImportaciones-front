import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdmin } from "@/lib/server/auth";

export async function GET(req: Request) {
  if (!isAdmin(req)) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const rows = await prisma.productQuestion.findMany({
    include: { product: { select: { team: true } } },
    orderBy: { createdAt: "desc" },
  });
  const questions = rows.map((q) => ({
    id: q.id,
    productId: q.productId,
    productName: q.product.team,
    name: q.name,
    question: q.question,
    answer: q.answer,
    createdAt: q.createdAt,
  }));
  return NextResponse.json(questions);
}
