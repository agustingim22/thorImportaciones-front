import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { isAdmin } from "@/lib/server/auth";
import { getBundleSettings, validateBundle } from "@/lib/server/bundle";
import type { BundleSettings } from "@/lib/bundle";

export async function GET(req: Request) {
  if (!isAdmin(req)) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  return NextResponse.json(await getBundleSettings());
}

export async function PUT(req: Request) {
  if (!isAdmin(req)) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const input = (await req.json()) as Partial<BundleSettings>;
  const error = validateBundle(input);
  if (error) return NextResponse.json({ error }, { status: 400 });

  const data = { enabled: input.enabled!, minQty: input.minQty!, percent: input.percent! };
  await prisma.bundleSettings.upsert({ where: { id: 1 }, create: { id: 1, ...data }, update: data });
  // Las fichas de producto muestran el cartel del combo y se sirven cacheadas: que se actualicen ya.
  revalidatePath("/producto/[slug]", "page");
  return NextResponse.json(await getBundleSettings());
}
