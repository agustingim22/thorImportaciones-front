import { NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { isAdmin } from "@/lib/server/auth";
import { validatePriceParams, type PriceUpdateParams } from "@/lib/priceUpdate";
import { PriceUpdateError, applyPriceUpdate, listPriceChanges, previewPriceUpdate } from "@/lib/server/priceUpdate";

/** Historial de actualizaciones de precios y cuál se puede deshacer. */
export async function GET(req: Request) {
  if (!isAdmin(req)) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  return NextResponse.json(await listPriceChanges(), { headers: { "Cache-Control": "no-store" } });
}

/** Vista previa (`mode: "preview"`) o aplicación (`mode: "apply"`, con lo que se vio en la vista previa en `expect`). */
export async function POST(req: Request) {
  if (!isAdmin(req)) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  let body: Partial<PriceUpdateParams> & { mode?: string; expect?: { count?: unknown; sumNew?: unknown } };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Pedido inválido." }, { status: 400 });
  }
  const invalid = validatePriceParams(body);
  if (invalid) return NextResponse.json({ error: invalid }, { status: 400 });
  const params: PriceUpdateParams = {
    percent: body.percent!,
    rounding: body.rounding!,
    includeSale: body.includeSale!,
    types: [...new Set(body.types!)],
    club: body.club!,
  };

  try {
    if (body.mode === "preview") return NextResponse.json(await previewPriceUpdate(params));

    if (body.mode === "apply") {
      const { count, sumNew } = body.expect ?? {};
      if (typeof count !== "number" || typeof sumNew !== "number") {
        return NextResponse.json({ error: "Primero hay que ver la vista previa." }, { status: 400 });
      }
      const result = await applyPriceUpdate(params, { count, sumNew });
      // Los precios se ven en casi todas las páginas: que se renueven en la próxima visita, no dentro de 1 a 5 minutos.
      revalidatePath("/", "layout");
      revalidateTag("products", "max");
      return NextResponse.json({ ...result, ...(await listPriceChanges()) });
    }
    return NextResponse.json({ error: "Acción no válida." }, { status: 400 });
  } catch (err) {
    if (err instanceof PriceUpdateError) return NextResponse.json({ error: err.message }, { status: err.status });
    throw err;
  }
}
