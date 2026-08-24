import { NextResponse } from "next/server";
import { registerFavoriteWatch } from "@/lib/favoriteWatch";
import { rateLimit } from "@/lib/server/ratelimit";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: Request) {
  const limited = await rateLimit("favorite-watch", req, 20, 10 * 60);
  if (limited) return limited;

  const { email, productIds } = (await req.json()) as { email?: string; productIds?: number[] };
  const clean = email?.trim().toLowerCase() ?? "";
  if (!EMAIL_RE.test(clean)) {
    return NextResponse.json({ error: "Ingresá un email válido." }, { status: 400 });
  }
  const ids = Array.isArray(productIds) ? productIds.filter((id) => Number.isInteger(id)) : [];
  if (ids.length === 0) {
    return NextResponse.json({ error: "No hay productos para avisar." }, { status: 400 });
  }

  await registerFavoriteWatch(clean, ids);
  return NextResponse.json({ ok: true }, { status: 201 });
}
