import "server-only";
import { prisma } from "./prisma";
import type { ShippingSettings } from "./shippingCalc";

/** Configuración de envío vigente (fila única, id=1). Sin fila cargada = sin costo de envío. */
export async function getShippingSettings(): Promise<ShippingSettings> {
  const row = await prisma.shippingSettings.findUnique({ where: { id: 1 } });
  return { flatCost: row?.flatCost ?? 0, freeShippingThreshold: row?.freeShippingThreshold ?? null };
}
