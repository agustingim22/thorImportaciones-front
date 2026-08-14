import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdmin } from "@/lib/server/auth";
import { getShippingSettings } from "@/lib/shipping";

export async function GET(req: Request) {
  if (!isAdmin(req)) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  return NextResponse.json(await getShippingSettings());
}

export async function PUT(req: Request) {
  if (!isAdmin(req)) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const { flatCost, freeShippingThreshold } = (await req.json()) as {
    flatCost?: number;
    freeShippingThreshold?: number | null;
  };

  if (!Number.isInteger(flatCost) || (flatCost as number) < 0)
    return NextResponse.json({ error: "El costo de envío debe ser un número entero mayor o igual a 0." }, { status: 400 });
  if (
    freeShippingThreshold !== null &&
    freeShippingThreshold !== undefined &&
    (!Number.isInteger(freeShippingThreshold) || freeShippingThreshold < 0)
  )
    return NextResponse.json({ error: "El monto de envío gratis no es válido." }, { status: 400 });

  const settings = await prisma.shippingSettings.upsert({
    where: { id: 1 },
    create: { id: 1, flatCost: flatCost as number, freeShippingThreshold: freeShippingThreshold ?? null },
    update: { flatCost: flatCost as number, freeShippingThreshold: freeShippingThreshold ?? null },
  });
  return NextResponse.json(settings);
}
