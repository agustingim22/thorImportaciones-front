import "server-only";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { detectClubForProduct } from "@/lib/clubs";
import { compareWithinTeam, composeRank, rankMeta, type RankMeta } from "@/lib/ranking";

// Cantidad de filas por UPDATE, para no pasarse del límite de parámetros de Postgres.
const CHUNK = 2000;

export type ClassifySummary = {
  dryRun: boolean;
  total: number;
  matched: number; // productos que tienen (o tendrían) un equipo
  unmatched: number; // sin equipo destacado (otros equipos, NBA, rugby, etc.)
  pendingChanges: number; // productos que cambian al aplicar (de equipo o de posición en el orden)
  manual: number; // con equipo elegido a mano en el admin: nunca se tocan
  byClub: Record<string, number>; // slug del equipo → cantidad de productos
  unmatchedSample: string[]; // muestra de nombres que quedaron sin equipo
  updated?: number; // solo al aplicar
};

/** Asigna a cada producto su equipo destacado según el nombre (salvo NBA y rugby, y salvo los que
 *  el admin fijó a mano) y recalcula su posición en el orden "Destacados" (`rank`, ver lib/ranking.ts),
 *  que depende de los demás productos del equipo. Con `apply=false` es un simulacro que no toca nada;
 *  con `apply=true` aplica los cambios. Es idempotente: correrlo de nuevo sin novedades no cambia nada. */
export async function classifyClubs(apply: boolean): Promise<ClassifySummary> {
  const rows = await prisma.product.findMany({
    select: { id: true, team: true, type: true, club: true, clubManual: true, rank: true, createdAt: true },
  });

  type Item = { row: (typeof rows)[number]; club: string | null; meta: RankMeta };
  const items: Item[] = rows.map((row) => {
    const club = row.clubManual ? row.club : (detectClubForProduct(row.team, row.type)?.slug ?? null);
    return { row, club, meta: rankMeta(row.team, row.type, club) };
  });

  // Secuencia dentro de cada (grupo, tier, equipo): 0, 1, 2… por temporada más nueva y camiseta Local primero.
  const parts = new Map<string, Item[]>();
  for (const it of items) {
    const key = `${it.meta.group}|${it.meta.tier}|${it.club ?? ""}`;
    const list = parts.get(key);
    if (list) list.push(it);
    else parts.set(key, [it]);
  }
  const newRank = new Map<number, number>();
  for (const list of parts.values()) {
    list.sort((a, b) =>
      compareWithinTeam(
        { meta: a.meta, createdAt: a.row.createdAt, id: a.row.id },
        { meta: b.meta, createdAt: b.row.createdAt, id: b.row.id },
      ),
    );
    list.forEach((it, seq) => newRank.set(it.row.id, composeRank(it.meta, seq)));
  }

  const byClub: Record<string, number> = {};
  const unmatchedNames: string[] = [];
  const clubChanges = new Map<string | null, number[]>();
  const rankChanges: { id: number; rank: number }[] = [];
  const changed = new Set<number>();
  let unmatched = 0;
  let manual = 0;

  for (const it of items) {
    const { row, club } = it;
    if (row.clubManual) manual++;
    if (club) {
      byClub[club] = (byClub[club] ?? 0) + 1;
    } else {
      unmatched++;
      if (!row.clubManual) unmatchedNames.push(row.team);
    }
    if (club !== row.club) {
      const ids = clubChanges.get(club);
      if (ids) ids.push(row.id);
      else clubChanges.set(club, [row.id]);
      changed.add(row.id);
    }
    const rank = newRank.get(row.id)!;
    if (rank !== row.rank) {
      rankChanges.push({ id: row.id, rank });
      changed.add(row.id);
    }
  }

  // Muestra espaciada de los que quedaron sin equipo, para revisar a ojo si falta algún alias.
  const step = Math.max(1, Math.floor(unmatchedNames.length / 40));
  const unmatchedSample = unmatchedNames.filter((_, i) => i % step === 0).slice(0, 40);

  const base = { total: rows.length, matched: rows.length - unmatched, unmatched, manual, byClub, unmatchedSample };
  if (!apply) return { dryRun: true, pendingChanges: changed.size, ...base };

  const ops: Prisma.PrismaPromise<unknown>[] = [];
  for (const [club, ids] of clubChanges) {
    for (let i = 0; i < ids.length; i += CHUNK) {
      ops.push(prisma.product.updateMany({ where: { id: { in: ids.slice(i, i + CHUNK) } }, data: { club } }));
    }
  }
  // La posición es distinta para casi cada producto: un solo UPDATE por tanda con una tabla de valores.
  for (let i = 0; i < rankChanges.length; i += CHUNK) {
    const values = rankChanges.slice(i, i + CHUNK).map((c) => Prisma.sql`(${c.id}::int, ${c.rank}::int)`);
    ops.push(
      prisma.$executeRaw`UPDATE "Product" AS p SET "rank" = v.rank FROM (VALUES ${Prisma.join(values)}) AS v(id, rank) WHERE p."id" = v.id`,
    );
  }
  if (ops.length > 0) await prisma.$transaction(ops);

  return { dryRun: false, pendingChanges: 0, ...base, updated: changed.size };
}
