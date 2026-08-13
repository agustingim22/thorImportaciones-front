import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdmin } from "@/lib/server/auth";

export async function GET(req: Request) {
  if (!isAdmin(req)) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const images = await prisma.heroImage.findMany({ orderBy: { position: "asc" } });
  return NextResponse.json(images);
}

export async function POST(req: Request) {
  if (!isAdmin(req)) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const { imageUrl } = (await req.json()) as { imageUrl?: string };
  if (!imageUrl?.trim()) return NextResponse.json({ error: "Falta la imagen." }, { status: 400 });

  const last = await prisma.heroImage.findFirst({ orderBy: { position: "desc" } });
  const image = await prisma.heroImage.create({
    data: { imageUrl: imageUrl.trim(), position: (last?.position ?? -1) + 1 },
  });
  return NextResponse.json(image, { status: 201 });
}
