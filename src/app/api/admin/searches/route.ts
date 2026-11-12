import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdmin } from "@/lib/server/auth";

/** Lo que buscan los clientes: lo que NO encuentran (results = 0), lo más buscado, y los totales. */
export async function GET(req: Request) {
  if (!isAdmin(req)) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const [zero, top, totals] = await Promise.all([
    prisma.searchTerm.findMany({ where: { results: 0 }, orderBy: [{ searches: "desc" }, { lastAt: "desc" }], take: 50 }),
    prisma.searchTerm.findMany({ where: { results: { gt: 0 } }, orderBy: [{ searches: "desc" }, { lastAt: "desc" }], take: 30 }),
    prisma.searchTerm.aggregate({ _sum: { searches: true }, _count: { _all: true } }),
  ]);
  const pick = (r: (typeof zero)[number]) => ({
    id: r.id,
    term: r.term,
    searches: r.searches,
    results: r.results,
    lastAt: r.lastAt.toISOString(),
  });
  return NextResponse.json({
    zero: zero.map(pick),
    top: top.map(pick),
    totalSearches: totals._sum.searches ?? 0,
    distinctTerms: totals._count._all,
  });
}

/** Descarta una búsqueda de la lista (por ejemplo, una que ya resolviste sumando el equipo). */
export async function DELETE(req: Request) {
  if (!isAdmin(req)) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const raw = new URL(req.url).searchParams.get("id");
  const id = raw ? Number(raw) : NaN; // sin id, Number(null) daría 0 y pasaría por un id válido
  if (!Number.isInteger(id) || id <= 0) return NextResponse.json({ error: "Falta el id." }, { status: 400 });
  await prisma.searchTerm.deleteMany({ where: { id } });
  return new NextResponse(null, { status: 204 });
}
