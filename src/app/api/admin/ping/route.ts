import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/server/auth";

// Valida el token de admin (lo usa el login del panel).
export async function GET(req: Request) {
  if (!isAdmin(req)) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  return NextResponse.json({ ok: true });
}
