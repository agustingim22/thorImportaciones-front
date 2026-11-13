import { NextResponse } from "next/server";
import { ADMIN_COOKIE, ADMIN_COOKIE_PATH, createAdminSession, isWeakAdminToken, tokenMatches } from "@/lib/server/auth";
import { rateLimit } from "@/lib/server/ratelimit";

/** Entrar al panel: se manda el token una vez y se recibe la cookie de sesión (httpOnly). Con límite de intentos por
 *  IP (Upstash) para que nadie pueda probar claves una tras otra. */
export async function POST(req: Request) {
  const limited = await rateLimit("admin-login", req, 8, 15 * 60);
  if (limited) return limited;

  let token = "";
  try {
    const body = (await req.json()) as { token?: unknown };
    token = typeof body.token === "string" ? body.token.trim() : "";
  } catch {
    /* sin cuerpo válido: queda como token vacío */
  }
  if (!tokenMatches(token)) return NextResponse.json({ error: "Token incorrecto." }, { status: 401 });

  const { value, expires } = createAdminSession();
  const res = NextResponse.json({ ok: true, weakToken: isWeakAdminToken() });
  res.cookies.set(ADMIN_COOKIE, value, {
    httpOnly: true, // el JavaScript de la página no puede leerla
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict", // el navegador no la manda en pedidos que vienen de otros sitios
    path: ADMIN_COOKIE_PATH, // solo viaja a /api/admin/*, no a las páginas públicas
    expires,
  });
  res.headers.set("Cache-Control", "no-store");
  return res;
}
