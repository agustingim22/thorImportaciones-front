import { NextResponse } from "next/server";
import { classifyClubs } from "@/lib/server/clubs";
import { pruneSearchTerms } from "@/lib/server/searches";

/** Clasifica por equipo los productos nuevos (los que se importan con scripts, fuera del panel, entran
 *  sin equipo). Se puede llamar a mano con Authorization: Bearer $CRON_SECRET. Además corre todos los
 *  días colgado del cron de review-requests (ver ahí por qué no tiene su propia entrada en vercel.json). */
export async function GET(req: Request) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const result = await classifyClubs(true);
  const pruned = await pruneSearchTerms().catch(() => 0);
  return NextResponse.json({ ok: true, total: result.total, updated: result.updated ?? 0, searchesPruned: pruned });
}
