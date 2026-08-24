import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdmin } from "@/lib/server/auth";

const IG_URL_RE = /^https?:\/\/(www\.)?instagram\.com\/(p|reel)\/[^/?#]+\/?/i;

export async function GET(req: Request) {
  if (!isAdmin(req)) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const posts = await prisma.instagramPost.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json(posts);
}

export async function POST(req: Request) {
  if (!isAdmin(req)) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const { url } = (await req.json()) as { url?: string };
  const clean = url?.trim() ?? "";
  if (!IG_URL_RE.test(clean)) {
    return NextResponse.json(
      { error: "Pegá el link de un post o reel de Instagram (instagram.com/p/... o /reel/...)." },
      { status: 400 },
    );
  }

  const post = await prisma.instagramPost.create({ data: { url: clean } });
  return NextResponse.json(post, { status: 201 });
}
