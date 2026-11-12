import "server-only";
import type { Prisma, PrismaClient } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { BUNDLE_LIMITS, BUNDLE_OFF, type BundleSettings } from "@/lib/bundle";

type Db = PrismaClient | Prisma.TransactionClient;

/** Configuración del combo (fila única, id=1). Sin fila cargada = apagado. Acepta una transacción para leerlo
 *  dentro del mismo pedido que se está creando. */
export async function getBundleSettings(db: Db = prisma): Promise<BundleSettings> {
  const row = await db.bundleSettings.findUnique({ where: { id: 1 } });
  return row ? { enabled: row.enabled, minQty: row.minQty, percent: row.percent } : BUNDLE_OFF;
}

/** Devuelve el mensaje de error si la configuración no es válida, o null si está bien. */
export function validateBundle(input: Partial<BundleSettings>): string | null {
  const { minQty, percent } = BUNDLE_LIMITS;
  if (typeof input.enabled !== "boolean") return "Indicá si el combo está encendido o apagado.";
  if (!Number.isInteger(input.minQty) || input.minQty! < minQty.min || input.minQty! > minQty.max)
    return `La cantidad mínima tiene que ser un número entero entre ${minQty.min} y ${minQty.max}.`;
  if (!Number.isInteger(input.percent) || input.percent! < percent.min || input.percent! > percent.max)
    return `El descuento tiene que ser un número entero entre ${percent.min}% y ${percent.max}%.`;
  return null;
}
