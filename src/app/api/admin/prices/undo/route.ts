import { NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { isAdmin } from "@/lib/server/auth";
import { PriceUpdateError, listPriceChanges, undoLastPriceUpdate } from "@/lib/server/priceUpdate";

/** Deshace la última actualización de precios (solo restaura lo que no se haya vuelto a editar). */
export async function POST(req: Request) {
  if (!isAdmin(req)) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  try {
    const result = await undoLastPriceUpdate();
    revalidatePath("/", "layout");
    revalidateTag("products", "max");
    return NextResponse.json({ ...result, ...(await listPriceChanges()) });
  } catch (err) {
    if (err instanceof PriceUpdateError) return NextResponse.json({ error: err.message }, { status: err.status });
    throw err;
  }
}
