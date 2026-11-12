import { NextResponse } from "next/server";
import { getBundleSettings } from "@/lib/server/bundle";
import { BUNDLE_OFF } from "@/lib/bundle";

/** Configuración pública del combo, para que el carrito muestre el descuento. El servidor igual la recalcula. */
export async function GET() {
  try {
    return NextResponse.json(await getBundleSettings());
  } catch {
    return NextResponse.json(BUNDLE_OFF); // si la base no responde, el carrito sigue sin combo
  }
}
