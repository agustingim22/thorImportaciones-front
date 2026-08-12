import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/server/session";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  // Aislado estrictamente por el usuario de la sesión actual: nunca se filtra
  // por un id que mande el cliente.
  const orders = await prisma.order.findMany({
    where: { userId: user.id },
    include: { items: true, customItems: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(orders);
}
