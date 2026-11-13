import { NextResponse } from "next/server";
import { isAdmin, isWeakAdminToken } from "@/lib/server/auth";

// Dice si hay una sesión de administrador válida (cookie o token). Lo usa el panel al abrirse.
// `weakToken` avisa si ADMIN_TOKEN es corto, para que la dueña lo cambie por uno largo en Vercel.
export async function GET(req: Request) {
  if (!isAdmin(req)) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  return NextResponse.json({ ok: true, weakToken: isWeakAdminToken() }, { headers: { "Cache-Control": "no-store" } });
}
