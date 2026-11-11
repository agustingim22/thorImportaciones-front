import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdmin } from "@/lib/server/auth";
import { detectClub } from "@/lib/clubs";

// Cantidad de ids por UPDATE, para no pasarse del límite de parámetros de Postgres.
const CHUNK = 2000;

/** Calcula qué club le corresponde a cada producto y qué filas habría que cambiar. */
async function buildPlan() {
  const rows = await prisma.product.findMany({ select: { id: true, team: true, club: true } });
  const byClub: Record<string, number> = {};
  const unmatched: string[] = [];
  const changes = new Map<string | null, number[]>();

  for (const row of rows) {
    const slug = detectClub(row.team)?.slug ?? null;
    if (slug) byClub[slug] = (byClub[slug] ?? 0) + 1;
    else unmatched.push(row.team);
    if (slug !== row.club) {
      const ids = changes.get(slug);
      if (ids) ids.push(row.id);
      else changes.set(slug, [row.id]);
    }
  }

  // Muestra espaciada de los que quedaron sin club, para revisar a ojo si falta algún alias.
  const step = Math.max(1, Math.floor(unmatched.length / 40));
  const unmatchedSample = unmatched.filter((_, i) => i % step === 0).slice(0, 40);

  return {
    changes,
    summary: {
      total: rows.length,
      matched: rows.length - unmatched.length,
      unmatched: unmatched.length,
      pendingChanges: [...changes.values()].reduce((n, ids) => n + ids.length, 0),
      byClub,
      unmatchedSample,
    },
  };
}

/** Simulacro: muestra qué pasaría, sin tocar la base. */
export async function GET(req: Request) {
  if (!isAdmin(req)) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const { summary } = await buildPlan();
  return NextResponse.json({ dryRun: true, ...summary });
}

/** Aplica la clasificación. Es idempotente: volver a correrla no cambia nada si no hay novedades. */
export async function POST(req: Request) {
  if (!isAdmin(req)) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const { changes, summary } = await buildPlan();

  const ops = [];
  for (const [club, ids] of changes) {
    for (let i = 0; i < ids.length; i += CHUNK) {
      ops.push(
        prisma.product.updateMany({ where: { id: { in: ids.slice(i, i + CHUNK) } }, data: { club } }),
      );
    }
  }
  if (ops.length > 0) await prisma.$transaction(ops);

  return NextResponse.json({ dryRun: false, updated: summary.pendingChanges, ...summary, pendingChanges: 0 });
}
