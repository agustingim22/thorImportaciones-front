import { NextResponse } from "next/server";
import { getProductByIdOrSlug } from "@/lib/products";

export async function GET(_req: Request, { params }: { params: Promise<{ idOrSlug: string }> }) {
  const { idOrSlug } = await params;
  const product = await getProductByIdOrSlug(idOrSlug);
  return product ? NextResponse.json(product) : NextResponse.json({ error: "No encontrado" }, { status: 404 });
}
