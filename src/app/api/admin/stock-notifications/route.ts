import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdmin } from "@/lib/server/auth";

/** Cuántas personas están esperando el reabastecimiento de cada producto (aún sin avisar). */
export async function GET(req: Request) {
  if (!isAdmin(req)) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const rows = await prisma.stockNotification.groupBy({
    by: ["productId"],
    where: { notified: false },
    _count: { _all: true },
  });

  return NextResponse.json(rows.map((r) => ({ productId: r.productId, count: r._count._all })));
}
