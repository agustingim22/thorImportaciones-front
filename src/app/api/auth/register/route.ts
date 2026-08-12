import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { createSession, hashPassword, toPublicUser } from "@/lib/server/session";

type Body = { email?: string; password?: string; name?: string; phone?: string };

export async function POST(req: Request) {
  const body = (await req.json()) as Body;

  const errors: Record<string, string[]> = {};
  const email = body.email?.trim().toLowerCase() ?? "";
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = ["Ingresá un email válido."];
  if (!body.password || body.password.length < 8)
    errors.password = ["La contraseña debe tener al menos 8 caracteres."];
  if (!body.name?.trim()) errors.name = ["Ingresá tu nombre."];
  if (Object.keys(errors).length) return NextResponse.json({ errors }, { status: 400 });

  let user;
  try {
    user = await prisma.user.create({
      data: {
        email,
        passwordHash: hashPassword(body.password!),
        name: body.name!.trim(),
        phone: body.phone?.trim() || null,
      },
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return NextResponse.json({ errors: { email: ["Ese email ya está registrado."] } }, { status: 400 });
    }
    throw err;
  }

  // Vincular al historial los pedidos que haya hecho antes como invitado con este mismo email
  // (comparación sin distinguir mayúsculas, por si el pedido se guardó con otro casing).
  await prisma.order.updateMany({
    where: { customerEmail: { equals: email, mode: "insensitive" }, userId: null },
    data: { userId: user.id },
  });

  await createSession(user.id);
  return NextResponse.json({ user: toPublicUser(user) }, { status: 201 });
}
