import "server-only";
import { prisma } from "@/lib/prisma";
import { detectClubForProduct } from "@/lib/clubs";

// Cantidad de ids por UPDATE, para no pasarse del límite de parámetros de Postgres.
const CHUNK = 2000;

export type ClassifySummary = {
  dryRun: boolean;
  total: number;
  matched: number; // productos que tienen (o tendrían) un equipo
  unmatched: number; // sin equipo destacado (otros equipos, NBA, rugby, etc.)
  pendingChanges: number; // productos que cambian al aplicar
  manual: number; // con equipo elegido a mano en el admin: nunca se tocan
  byClub: Record<string, number>; // slug del equipo → cantidad de productos
  unmatchedSample: string[]; // muestra de nombres que quedaron sin equipo
  updated?: number; // solo al aplicar
};

/** Asigna a cada producto su equipo destacado según el nombre (salvo NBA y rugby, y salvo los que
 *  el admin fijó a mano). Con `apply=false` es un simulacro que no toca nada; con `apply=true`
 *  aplica los cambios. Es idempotente: correrlo de nuevo sin novedades no cambia nada. */
export async function classifyClubs(apply: boolean): Promise<ClassifySummary> {
  const rows = await prisma.product.findMany({
    select: { id: true, team: true, type: true, club: true, clubManual: true },
  });
  const byClub: Record<string, number> = {};
  const unmatchedNames: string[] = [];
  const changes = new Map<string | null, number[]>();
  let unmatched = 0;
  let manual = 0;

  for (const row of rows) {
    if (row.clubManual) manual++;
    const slug = row.clubManual ? row.club : (detectClubForProduct(row.team, row.type)?.slug ?? null);
    if (slug) {
      byClub[slug] = (byClub[slug] ?? 0) + 1;
    } else {
      unmatched++;
      if (!row.clubManual) unmatchedNames.push(row.team);
    }
    if (!row.clubManual && slug !== row.club) {
      const ids = changes.get(slug);
      if (ids) ids.push(row.id);
      else changes.set(slug, [row.id]);
    }
  }

  // Muestra espaciada de los que quedaron sin equipo, para revisar a ojo si falta algún alias.
  const step = Math.max(1, Math.floor(unmatchedNames.length / 40));
  const unmatchedSample = unmatchedNames.filter((_, i) => i % step === 0).slice(0, 40);
  const pendingChanges = [...changes.values()].reduce((n, ids) => n + ids.length, 0);

  if (!apply) {
    return { dryRun: true, total: rows.length, matched: rows.length - unmatched, unmatched, pendingChanges, manual, byClub, unmatchedSample };
  }

  const ops = [];
  for (const [club, ids] of changes) {
    for (let i = 0; i < ids.length; i += CHUNK) {
      ops.push(prisma.product.updateMany({ where: { id: { in: ids.slice(i, i + CHUNK) } }, data: { club } }));
    }
  }
  if (ops.length > 0) await prisma.$transaction(ops);

  return {
    dryRun: false,
    total: rows.length,
    matched: rows.length - unmatched,
    unmatched,
    pendingChanges: 0,
    manual,
    byClub,
    unmatchedSample,
    updated: pendingChanges,
  };
}
