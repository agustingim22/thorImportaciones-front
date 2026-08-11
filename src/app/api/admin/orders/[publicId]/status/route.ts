import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdmin } from "@/lib/server/auth";

const VALID = ["Pending", "Paid", "Cancelled", "Delivered"];

export async function POST(req: Request, { params }: { params: Promise<{ publicId: string }> }) {
  if (!isAdmin(req)) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const { publicId } = await params;
  const { status } = (await req.json()) as { status?: string };

  if (!status || !VALID.includes(status))
    return NextResponse.json({ error: "Estado inválido." }, { status: 400 });

  const order = await prisma.order.findUnique({ where: { publicId } });
  if (!order) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  const updated = await prisma.order.update({ where: { publicId }, data: { status } });
  return NextResponse.json({ orderId: updated.publicId, status: updated.status });
}
