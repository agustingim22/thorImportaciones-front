import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdmin } from "@/lib/server/auth";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!isAdmin(req)) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const { id } = await params;
  const { position } = (await req.json()) as { position?: number };
  if (typeof position !== "number") return NextResponse.json({ error: "Posición inválida." }, { status: 400 });

  const image = await prisma.heroImage.update({ where: { id: Number(id) }, data: { position } });
  return NextResponse.json(image);
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!isAdmin(req)) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const { id } = await params;
  await prisma.heroImage.delete({ where: { id: Number(id) } });
  return new NextResponse(null, { status: 204 });
}
