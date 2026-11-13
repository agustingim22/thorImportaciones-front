import "server-only";
import type { Prisma, PrismaClient } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { BUNDLE_LIMITS, BUNDLE_OFF, type BundleSettings } from "@/lib/bundle";

type Db = PrismaClient | Prisma.TransactionClient;

/** Configuración del combo (fila única, id=1). Sin fila cargada = apagado. Acepta una transacción para leerlo
 *  dentro del mismo pedido que se está creando. */
export async function getBundleSettings(db: Db = prisma): Promise<BundleSettings> {
  const row = await db.bundleSettings.findUnique({ where: { id: 1 } });
  return row
    ? { enabled: row.enabled, minQty: row.minQty, percent: row.percent, minQty2: row.minQty2, percent2: row.percent2 }
    : BUNDLE_OFF;
}

/** Devuelve el mensaje de error si la configuración no es válida, o null si está bien. */
export function validateBundle(input: Partial<BundleSettings>): string | null {
  const { minQty, percent } = BUNDLE_LIMITS;
  if (typeof input.enabled !== "boolean") return "Indicá si el combo está encendido o apagado.";
  if (!Number.isInteger(input.minQty) || input.minQty! < minQty.min || input.minQty! > minQty.max)
    return `La cantidad mínima tiene que ser un número entero entre ${minQty.min} y ${minQty.max}.`;
  if (!Number.isInteger(input.percent) || input.percent! < percent.min || input.percent! > percent.max)
    return `El descuento tiene que ser un número entero entre ${percent.min}% y ${percent.max}%.`;

  // Segundo escalón: opcional, pero si se carga van los dos datos, con más unidades y más descuento que el primero.
  const hasQty2 = input.minQty2 != null;
  const hasPercent2 = input.percent2 != null;
  if (hasQty2 !== hasPercent2) return "El segundo escalón necesita la cantidad y el descuento, o ninguno de los dos.";
  if (hasQty2 && hasPercent2) {
    if (!Number.isInteger(input.minQty2) || input.minQty2! > minQty.max || input.minQty2! <= input.minQty!)
      return `El segundo escalón tiene que empezar en más de ${input.minQty} camisetas (hasta ${minQty.max}).`;
    if (!Number.isInteger(input.percent2) || input.percent2! > percent.max || input.percent2! <= input.percent!)
      return `El descuento del segundo escalón tiene que ser mayor que ${input.percent}% (hasta ${percent.max}%).`;
  }
  return null;
}
