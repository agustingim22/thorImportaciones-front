import { NextRequest, NextResponse } from "next/server";
import { isMpConfigured } from "@/lib/server/mercadopago";
import { applyPayment } from "@/lib/server/orders";

export async function POST(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  let id = sp.get("data.id") ?? sp.get("id");
  let topic = sp.get("type") ?? sp.get("topic");

  if (!id) {
    try {
      const body = await req.json();
      topic = topic ?? body?.type ?? null;
      id = body?.data?.id ? String(body.data.id) : null;
    } catch {
      /* body no JSON o vacío */
    }
  }

  // Solo procesamos notificaciones de pago
  if (topic && topic !== "payment") return NextResponse.json({ ok: true });
  if (isMpConfigured() && id) {
    try {
      await applyPayment(id);
    } catch {
      /* ignoramos errores para que MP no reintente en loop */
    }
  }
  return NextResponse.json({ ok: true }); // siempre 200
}
