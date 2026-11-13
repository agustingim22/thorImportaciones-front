import "server-only";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  computeChanges,
  expectationOf,
  type PriceChangeItem,
  type PriceChangeSummary,
  type PriceExpectation,
  type PricePreview,
  type PriceUpdateParams,
} from "@/lib/priceUpdate";

/** Error que se le puede mostrar tal cual a quien administra (con el código HTTP que corresponde). */
export class PriceUpdateError extends Error {
  constructor(
    message: string,
    public status = 400,
  ) {
    super(message);
  }
}

const CHUNK = 1000; // filas por UPDATE (5 parámetros cada una: lejos del límite de Postgres)
const KEEP_HISTORY = 20; // cuántas actualizaciones se guardan para poder verlas y deshacer la última
const TX = { timeout: 60_000, maxWait: 10_000 } as const;

type Db = Prisma.TransactionClient | typeof prisma;

function scopeWhere(p: PriceUpdateParams): Prisma.ProductWhereInput {
  const where: Prisma.ProductWhereInput = { type: { in: p.types } };
  if (p.club === "none") where.club = null;
  else if (p.club) where.club = p.club;
  return where;
}

const selectRows = (db: Db, p: PriceUpdateParams) =>
  db.product.findMany({
    where: scopeWhere(p),
    select: { id: true, team: true, type: true, price: true, salePrice: true },
    orderBy: { id: "asc" },
  });

/** Ejemplos repartidos a lo largo de la lista (no solo los primeros), para que se vea la variedad. */
function spread<T>(list: T[], n: number): T[] {
  if (list.length <= n) return list;
  return Array.from({ length: n }, (_, i) => list[Math.floor((i * list.length) / n)]);
}

/** Calcula qué cambiaría, sin tocar nada. */
export async function previewPriceUpdate(params: PriceUpdateParams): Promise<PricePreview> {
  const rows = await selectRows(prisma, params);
  const changes = computeChanges(rows, params);
  const byId = new Map(rows.map((r) => [r.id, r]));
  const prices = changes.map((c) => c.newPrice);
  const avg =
    changes.length > 0 ? changes.reduce((s, c) => s + ((c.newPrice - c.price) / c.price) * 100, 0) / changes.length : 0;
  return {
    count: changes.length,
    unchanged: rows.length - changes.length,
    withSale: changes.filter((c) => c.salePrice != null).length,
    minNew: prices.length > 0 ? Math.min(...prices) : 0,
    maxNew: prices.length > 0 ? Math.max(...prices) : 0,
    avgChangePercent: Math.round(avg * 10) / 10,
    sample: spread(changes, 8).map((c) => ({ ...c, team: byId.get(c.id)!.team, type: byId.get(c.id)!.type })),
    expect: expectationOf(changes),
  };
}

const chunks = <T>(list: T[]): T[][] =>
  Array.from({ length: Math.ceil(list.length / CHUNK) }, (_, i) => list.slice(i * CHUNK, (i + 1) * CHUNK));

const row = (c: PriceChangeItem) =>
  Prisma.sql`(${c.id}::int, ${c.price}::int, ${c.salePrice}::int, ${c.newPrice}::int, ${c.newSalePrice}::int)`;

/**
 * Aplica el cambio de precios, todo o nada. Antes de tocar nada se vuelve a calcular y se compara con lo que se vio en
 * la vista previa (`expected`); y cada UPDATE solo pisa los productos cuyo precio siga siendo el que se calculó, así
 * que una edición hecha a mano mientras tanto nunca se pierde: si pasa, se cancela todo.
 */
export async function applyPriceUpdate(
  params: PriceUpdateParams,
  expected: PriceExpectation,
): Promise<{ count: number; id: number }> {
  return prisma.$transaction(async (tx) => {
    const changes = computeChanges(await selectRows(tx, params), params);
    const now = expectationOf(changes);
    if (changes.length === 0) throw new PriceUpdateError("No hay productos para cambiar con estos datos.");
    if (now.count !== expected.count || now.sumNew !== expected.sumNew) {
      throw new PriceUpdateError(
        "Los productos cambiaron desde la vista previa. Volvé a ver la vista previa y aplicá de nuevo.",
        409,
      );
    }
    for (const part of chunks(changes)) {
      const done = await tx.$executeRaw`
        UPDATE "Product" AS p SET "price" = v.np, "salePrice" = v.ns
        FROM (VALUES ${Prisma.join(part.map(row))}) AS v(id, op, os, np, ns)
        WHERE p."id" = v.id AND p."price" = v.op AND p."salePrice" IS NOT DISTINCT FROM v.os`;
      if (done !== part.length) {
        throw new PriceUpdateError(
          "Algunos productos se modificaron mientras se aplicaba el cambio. No se cambió nada: probá de nuevo.",
          409,
        );
      }
    }
    const record = await tx.priceChange.create({
      data: {
        percent: params.percent,
        rounding: params.rounding,
        scope: { types: params.types, club: params.club, includeSale: params.includeSale },
        count: changes.length,
        items: changes as unknown as Prisma.InputJsonValue,
      },
    });
    const old = await tx.priceChange.findMany({ orderBy: { id: "desc" }, skip: KEEP_HISTORY, select: { id: true } });
    if (old.length > 0) await tx.priceChange.deleteMany({ where: { id: { in: old.map((o) => o.id) } } });
    return { count: changes.length, id: record.id };
  }, TX);
}

/**
 * Deshace la última actualización que no se haya deshecho. Solo se restauran los productos cuyo precio sigue siendo el
 * que dejó esa actualización: si alguien lo editó a mano después, ese precio no se toca (se cuenta en `skipped`).
 */
export async function undoLastPriceUpdate(): Promise<{ reverted: number; skipped: number }> {
  return prisma.$transaction(async (tx) => {
    const last = await tx.priceChange.findFirst({ where: { revertedAt: null }, orderBy: { id: "desc" } });
    if (!last) throw new PriceUpdateError("No hay ninguna actualización para deshacer.", 404);
    const items = last.items as unknown as PriceChangeItem[];
    let reverted = 0;
    for (const part of chunks(items)) {
      reverted += await tx.$executeRaw`
        UPDATE "Product" AS p SET "price" = v.op, "salePrice" = v.os
        FROM (VALUES ${Prisma.join(part.map(row))}) AS v(id, op, os, np, ns)
        WHERE p."id" = v.id AND p."price" = v.np AND p."salePrice" IS NOT DISTINCT FROM v.ns`;
    }
    await tx.priceChange.update({ where: { id: last.id }, data: { revertedAt: new Date() } });
    return { reverted, skipped: items.length - reverted };
  }, TX);
}

/** Las últimas actualizaciones y cuál se puede deshacer (la más reciente que no se deshizo). */
export async function listPriceChanges(limit = 8): Promise<{ history: PriceChangeSummary[]; undoableId: number | null }> {
  const [rows, undoable] = await Promise.all([
    prisma.priceChange.findMany({
      orderBy: { id: "desc" },
      take: limit,
      select: { id: true, createdAt: true, percent: true, rounding: true, scope: true, count: true, revertedAt: true },
    }),
    prisma.priceChange.findFirst({ where: { revertedAt: null }, orderBy: { id: "desc" }, select: { id: true } }),
  ]);
  return {
    history: rows.map((r) => ({
      id: r.id,
      createdAt: r.createdAt.toISOString(),
      percent: r.percent,
      rounding: r.rounding,
      scope: r.scope as PriceChangeSummary["scope"],
      count: r.count,
      revertedAt: r.revertedAt ? r.revertedAt.toISOString() : null,
    })),
    undoableId: undoable?.id ?? null,
  };
}
