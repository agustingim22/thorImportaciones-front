import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/server/auth";
import { classifyClubs } from "@/lib/server/clubs";

/** Simulacro: muestra qué pasaría, sin tocar la base. */
export async function GET(req: Request) {
  if (!isAdmin(req)) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  return NextResponse.json(await classifyClubs(false));
}

/** Aplica la clasificación. Es idempotente: volver a correrla no cambia nada si no hay novedades. */
export async function POST(req: Request) {
  if (!isAdmin(req)) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  return NextResponse.json(await classifyClubs(true));
}
