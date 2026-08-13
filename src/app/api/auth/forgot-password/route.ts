import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createPasswordReset } from "@/lib/server/session";
import { sendPasswordReset } from "@/lib/server/email";
import { rateLimit } from "@/lib/server/ratelimit";

type Body = { email?: string };

export async function POST(req: Request) {
  const limited = await rateLimit("forgot-password", req, 5, 30 * 60);
  if (limited) return limited;

  const body = (await req.json()) as Body;
  const email = body.email?.trim().toLowerCase() ?? "";

  // Respuesta genérica siempre: no revelamos si el email está registrado o no.
  const genericResponse = NextResponse.json({
    message: "Si el email está registrado, te mandamos un link para restablecer tu contraseña.",
  });
  if (!email) return genericResponse;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return genericResponse;

  const token = await createPasswordReset(user.id);
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
  const resetUrl = `${appUrl}/cuenta/reset?token=${token}`;
  await sendPasswordReset(user.email, resetUrl);

  return genericResponse;
}
