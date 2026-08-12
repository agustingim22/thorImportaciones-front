import { NextRequest, NextResponse } from "next/server";
import { getProducts } from "@/lib/products";
import type { ProductType } from "@/lib/api";

const VALID_TYPES: ProductType[] = ["retro", "fan", "player"];

export async function GET(req: NextRequest) {
  const typeParam = req.nextUrl.searchParams.get("type");
  const type = VALID_TYPES.includes(typeParam as ProductType) ? (typeParam as ProductType) : undefined;
  const q = req.nextUrl.searchParams.get("q") ?? undefined;
  const products = await getProducts({ type, q });
  return NextResponse.json(products);
}
