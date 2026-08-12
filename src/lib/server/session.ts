import "server-only";
import crypto from "crypto";
import { cookies } from "next/headers";
import type { User } from "@prisma/client";
import { prisma } from "../prisma";
import type { PublicUser } from "../user";

export const SESSION_COOKIE = "thor_session";
const SESSION_DAYS = 30;

/** Hashea una contraseña con scrypt + salt aleatorio. Formato guardado: "salt:hash". */
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

/** Compara en tiempo constante para no filtrar información por timing. */
export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const candidate = crypto.scryptSync(password, salt, 64);
  const expected = Buffer.from(hash, "hex");
  if (candidate.length !== expected.length) return false;
  return crypto.timingSafeEqual(candidate, expected);
}

/** Crea una sesión en la base y setea la cookie httpOnly en la respuesta actual. */
export async function createSession(userId: number): Promise<void> {
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  const session = await prisma.session.create({ data: { userId, expiresAt } });
  const store = await cookies();
  store.set(SESSION_COOKIE, session.id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

/** Borra la sesión actual (DB + cookie). */
export async function destroySession(): Promise<void> {
  const store = await cookies();
  const sessionId = store.get(SESSION_COOKIE)?.value;
  if (sessionId) {
    await prisma.session.deleteMany({ where: { id: sessionId } }).catch(() => {});
  }
  store.delete(SESSION_COOKIE);
}

/** Quita el passwordHash antes de mandar el usuario al cliente. */
export function toPublicUser(u: User): PublicUser {
  return {
    id: u.id,
    email: u.email,
    name: u.name,
    phone: u.phone,
    street: u.street,
    postalCode: u.postalCode,
    city: u.city,
    province: u.province,
    floor: u.floor,
    apartment: u.apartment,
  };
}

/** Devuelve el usuario logueado según la cookie de sesión, o null. */
export async function getSessionUser() {
  const store = await cookies();
  const sessionId = store.get(SESSION_COOKIE)?.value;
  if (!sessionId) return null;

  const session = await prisma.session.findUnique({
    where: { id: sessionId },
    include: { user: true },
  });
  if (!session || session.expiresAt < new Date()) return null;
  return session.user;
}

const RESET_TOKEN_HOURS = 1;

/** Crea un token de recuperación de contraseña (válido 1 hora). Devuelve el token. */
export async function createPasswordReset(userId: number): Promise<string> {
  const expiresAt = new Date(Date.now() + RESET_TOKEN_HOURS * 60 * 60 * 1000);
  const reset = await prisma.passwordReset.create({ data: { userId, expiresAt } });
  return reset.id;
}

/**
 * Usa un token de recuperación: si es válido, cambia la contraseña, marca el
 * token como usado y cierra todas las sesiones activas del usuario (por seguridad).
 */
export async function consumePasswordReset(token: string, newPassword: string): Promise<boolean> {
  const reset = await prisma.passwordReset.findUnique({ where: { id: token } });
  if (!reset || reset.usedAt || reset.expiresAt < new Date()) return false;

  await prisma.$transaction([
    prisma.user.update({
      where: { id: reset.userId },
      data: { passwordHash: hashPassword(newPassword) },
    }),
    prisma.passwordReset.update({ where: { id: token }, data: { usedAt: new Date() } }),
    prisma.session.deleteMany({ where: { userId: reset.userId } }),
  ]);
  return true;
}
