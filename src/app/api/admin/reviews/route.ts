import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdmin } from "@/lib/server/auth";

export async function GET(req: Request) {
  if (!isAdmin(req)) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const rows = await prisma.review.findMany({
    include: { product: { select: { team: true } } },
    orderBy: { createdAt: "desc" },
  });
  const reviews = rows.map((r) => ({
    id: r.id,
    productId: r.productId,
    productName: r.product.team,
    name: r.name,
    rating: r.rating,
    comment: r.comment,
    published: r.published,
    createdAt: r.createdAt,
  }));
  return NextResponse.json(reviews);
}
