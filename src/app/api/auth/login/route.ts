import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSession, toPublicUser, verifyPassword } from "@/lib/server/session";
import { rateLimit } from "@/lib/server/ratelimit";

type Body = { email?: string; password?: string };

export async function POST(req: Request) {
  const limited = await rateLimit("login", req, 10, 10 * 60);
  if (limited) return limited;

  const body = (await req.json()) as Body;
  const email = body.email?.trim().toLowerCase() ?? "";

  if (!email || !body.password) {
    return NextResponse.json({ error: "Ingresá tu email y contraseña." }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !verifyPassword(body.password, user.passwordHash)) {
    return NextResponse.json({ error: "Email o contraseña incorrectos." }, { status: 401 });
  }

  await createSession(user.id);
  return NextResponse.json({ user: toPublicUser(user) });
}
