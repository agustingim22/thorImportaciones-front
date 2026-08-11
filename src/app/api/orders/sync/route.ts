import { NextResponse } from "next/server";
import { isMpConfigured } from "@/lib/server/mercadopago";
import { applyPayment } from "@/lib/server/orders";

export async function POST(req: Request) {
  if (!isMpConfigured()) return NextResponse.json({ configured: false });
  const { paymentId } = (await req.json()) as { paymentId?: string };
  if (!paymentId) return NextResponse.json({ error: "Falta paymentId" }, { status: 400 });
  try {
    await applyPayment(paymentId);
  } catch {
    /* si falla la consulta a MP, no rompemos la página de resultado */
  }
  return NextResponse.json({ configured: true });
}
