import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/server/ratelimit";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: Request) {
  const limited = await rateLimit("newsletter", req, 5, 10 * 60);
  if (limited) return limited;

  const { email } = (await req.json()) as { email?: string };
  const clean = email?.trim().toLowerCase() ?? "";
  if (!EMAIL_RE.test(clean))
    return NextResponse.json({ error: "Ingresá un email válido." }, { status: 400 });

  await prisma.subscriber.upsert({
    where: { email: clean },
    create: { email: clean },
    update: {},
  });

  return NextResponse.json({ ok: true }, { status: 201 });
}
