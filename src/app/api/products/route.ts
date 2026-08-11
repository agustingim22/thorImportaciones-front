import { NextRequest, NextResponse } from "next/server";
import { getProducts } from "@/lib/products";

export async function GET(req: NextRequest) {
  const typeParam = req.nextUrl.searchParams.get("type");
  const type = typeParam === "retro" || typeParam === "player" ? typeParam : undefined;
  const q = req.nextUrl.searchParams.get("q") ?? undefined;
  const products = await getProducts({ type, q });
  return NextResponse.json(products);
}
