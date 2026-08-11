import "server-only";
import crypto from "crypto";

/**
 * Valida el token de administrador contra ADMIN_TOKEN, con comparación de
 * tiempo constante. Acepta "Authorization: Bearer <token>" o "X-Admin-Token".
 */
export function isAdmin(req: Request): boolean {
  const expected = process.env.ADMIN_TOKEN;
  if (!expected) return false;

  const header = req.headers.get("authorization") ?? "";
  const provided = header.toLowerCase().startsWith("bearer ")
    ? header.slice(7).trim()
    : (req.headers.get("x-admin-token") ?? "").trim();
  if (!provided) return false;

  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
