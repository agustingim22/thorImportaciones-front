import { NextRequest, NextResponse } from "next/server";
import { getProducts } from "@/lib/products";
import { PRODUCT_TYPES, type ProductType } from "@/lib/api";

export async function GET(req: NextRequest) {
  const typeParam = req.nextUrl.searchParams.get("type");
  const type = PRODUCT_TYPES.includes(typeParam as ProductType) ? (typeParam as ProductType) : undefined;
  const q = req.nextUrl.searchParams.get("q") ?? undefined;
  const idsParam = req.nextUrl.searchParams.get("ids");
  const ids = idsParam
    ? idsParam
        .split(",")
        .map((s) => Number(s))
        .filter((n) => Number.isInteger(n))
    : undefined;
  const { products } = await getProducts({ type, q, ids });
  return NextResponse.json(products);
}
