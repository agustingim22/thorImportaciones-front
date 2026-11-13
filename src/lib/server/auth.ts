import "server-only";
import crypto from "crypto";

/**
 * Acceso de administrador. Hay dos formas de entrar, y las dos se validan contra ADMIN_TOKEN:
 *
 *  1. El panel: se ingresa el token una vez en /api/admin/login y el servidor responde con una cookie de sesión
 *     firmada, httpOnly (el JavaScript de la página no la puede leer, así que un XSS no se la lleva como pasaba
 *     con el token guardado en localStorage), SameSite=Strict y limitada a /api/admin.
 *  2. Scripts y curl: "Authorization: Bearer <token>" o "X-Admin-Token" (como siempre).
 *
 * La sesión no se guarda en ninguna base: es "vencimiento.firma", donde la firma es un HMAC con ADMIN_TOKEN como
 * clave. Cambiar ADMIN_TOKEN en Vercel invalida todas las sesiones abiertas.
 */
export const ADMIN_COOKIE = "thor_admin";
export const ADMIN_COOKIE_PATH = "/api/admin";
const SESSION_DAYS = 30;
/** Un token más corto que esto se avisa en el panel: ADMIN_TOKEN es la única llave de todo el sitio. */
const MIN_STRONG_TOKEN = 24;

function equalSafe(a: string, b: string): boolean {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && crypto.timingSafeEqual(x, y);
}

/** ¿Este texto es el token de administrador? (comparación en tiempo constante) */
export function tokenMatches(provided: string): boolean {
  const expected = process.env.ADMIN_TOKEN;
  if (!expected || !provided) return false;
  return equalSafe(provided, expected);
}

/** ¿El ADMIN_TOKEN configurado es corto o fácil de adivinar? (para avisarle a la dueña en el panel) */
export function isWeakAdminToken(): boolean {
  return (process.env.ADMIN_TOKEN ?? "").length < MIN_STRONG_TOKEN;
}

function sign(expiresAt: number): string | null {
  const key = process.env.ADMIN_TOKEN;
  if (!key) return null;
  return crypto.createHmac("sha256", key).update(`thor-admin-session|${expiresAt}`).digest("hex");
}

/** Valor y vencimiento de una cookie de sesión nueva. */
export function createAdminSession(now = Date.now()): { value: string; expires: Date } {
  const expiresAt = now + SESSION_DAYS * 24 * 60 * 60 * 1000;
  const signature = sign(expiresAt);
  if (!signature) throw new Error("ADMIN_TOKEN no está configurado");
  return { value: `${expiresAt}.${signature}`, expires: new Date(expiresAt) };
}

/** ¿La cookie es una sesión de admin vigente y bien firmada? */
export function validAdminSession(value: string | undefined | null, now = Date.now()): boolean {
  if (!value) return false;
  const dot = value.indexOf(".");
  if (dot <= 0) return false;
  const expiresAt = Number(value.slice(0, dot));
  if (!Number.isFinite(expiresAt) || expiresAt <= now) return false;
  const expected = sign(expiresAt);
  return !!expected && equalSafe(value.slice(dot + 1), expected);
}

function readCookie(req: Request, name: string): string | undefined {
  const header = req.headers.get("cookie");
  if (!header) return undefined;
  for (const part of header.split(";")) {
    const i = part.indexOf("=");
    if (i > 0 && part.slice(0, i).trim() === name) return part.slice(i + 1).trim();
  }
  return undefined;
}

/** La petición viene de una página de este mismo sitio (el Origin coincide con el Host). */
function sameOrigin(req: Request): boolean {
  const origin = req.headers.get("origin");
  if (!origin) return false;
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  try {
    return !!host && new URL(origin).host === host;
  } catch {
    return false;
  }
}

/**
 * ¿Quien hace la petición es el administrador? Acepta el token (Authorization: Bearer o X-Admin-Token) o la
 * cookie de sesión del panel. Con la cookie, las peticiones que modifican datos además tienen que venir de una
 * página del propio sitio (se verifica el Origin), como defensa extra contra CSRF.
 */
export function isAdmin(req: Request): boolean {
  if (!process.env.ADMIN_TOKEN) return false;

  const header = req.headers.get("authorization") ?? "";
  const provided = header.toLowerCase().startsWith("bearer ")
    ? header.slice(7).trim()
    : (req.headers.get("x-admin-token") ?? "").trim();
  if (provided) return tokenMatches(provided);

  if (!validAdminSession(readCookie(req, ADMIN_COOKIE))) return false;
  const safeMethod = req.method === "GET" || req.method === "HEAD";
  return safeMethod || sameOrigin(req);
}
