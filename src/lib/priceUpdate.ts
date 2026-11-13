/**
 * Actualización de precios por porcentaje (admin > Precios). Sin "server-only": el cálculo lo usan el servidor (que
 * es el que aplica) y las pruebas, y el panel comparte los tipos y los límites.
 *
 * El precio nuevo es `precio × (1 + porcentaje/100)` redondeado al múltiplo más cercano de `rounding` pesos. Los
 * precios en oferta (`salePrice`) se pueden ajustar con el mismo porcentaje para que la oferta siga siendo la misma.
 */
import { PRODUCT_TYPES } from "./api";

export const PRICE_LIMITS = { minPercent: -50, maxPercent: 100 } as const;
/** Múltiplos a los que se puede redondear, en pesos ($1 = sin redondeo). */
export const ROUNDING_OPTIONS = [1, 100, 500, 1000] as const;

export type PriceUpdateParams = {
  /** 8 sube 8%, -10 baja 10%. Con hasta un decimal. */
  percent: number;
  /** Se redondea al múltiplo más cercano de este monto. */
  rounding: number;
  /** También ajusta los precios en oferta con el mismo porcentaje. */
  includeSale: boolean;
  /** Tipos de producto que se actualizan (al menos uno). */
  types: string[];
  /** "" = todos los equipos, "none" = los que no tienen equipo, o el slug de un equipo. */
  club: string;
};

export type PriceRow = { id: number; price: number; salePrice: number | null };
export type PriceChangeItem = { id: number; price: number; salePrice: number | null; newPrice: number; newSalePrice: number | null };

/** Qué se esperaba ver al previsualizar: al aplicar se verifica que nada haya cambiado desde entonces. */
export type PriceExpectation = { count: number; sumNew: number };

export type PricePreview = {
  count: number; // productos que cambian
  unchanged: number; // productos de la selección que quedarían igual (el cambio es menor que el redondeo)
  withSale: number; // de los que cambian, cuántos tienen precio en oferta
  minNew: number;
  maxNew: number;
  avgChangePercent: number; // cambio promedio real, ya con el redondeo
  sample: { id: number; team: string; type: string; price: number; salePrice: number | null; newPrice: number; newSalePrice: number | null }[];
  expect: PriceExpectation;
};

/** Precio nuevo: aplica el porcentaje y redondea. Con `percent` de hasta un decimal el cálculo es exacto en enteros. */
export function newPrice(price: number, percent: number, rounding: number): number {
  const permille = 1000 + Math.round(percent * 10);
  const raw = (price * permille) / 1000;
  const step = Math.max(1, Math.floor(rounding));
  return Math.round(raw / step) * step;
}

/** Los productos que cambian con estos parámetros, con su precio de antes y de después. Los que quedan igual (o que
 *  llegarían a $0 o menos) no se tocan. */
export function computeChanges(rows: PriceRow[], params: Pick<PriceUpdateParams, "percent" | "rounding" | "includeSale">): PriceChangeItem[] {
  const out: PriceChangeItem[] = [];
  for (const r of rows) {
    const np = newPrice(r.price, params.percent, params.rounding);
    if (np <= 0) continue;
    const ns = params.includeSale && r.salePrice != null ? newPrice(r.salePrice, params.percent, params.rounding) : r.salePrice;
    const saleOk = ns == null || ns > 0;
    const finalSale = saleOk ? ns : r.salePrice;
    if (np === r.price && finalSale === r.salePrice) continue;
    out.push({ id: r.id, price: r.price, salePrice: r.salePrice, newPrice: np, newSalePrice: finalSale });
  }
  return out;
}

export const expectationOf = (changes: PriceChangeItem[]): PriceExpectation => ({
  count: changes.length,
  sumNew: changes.reduce((s, c) => s + c.newPrice + (c.newSalePrice ?? 0), 0),
});

/** Mensaje de error si los parámetros no sirven, o null si están bien. */
export function validatePriceParams(p: Partial<PriceUpdateParams>): string | null {
  const { minPercent, maxPercent } = PRICE_LIMITS;
  if (typeof p.percent !== "number" || !Number.isFinite(p.percent)) return "Ingresá el porcentaje.";
  if (Math.abs(p.percent * 10 - Math.round(p.percent * 10)) > 1e-9) return "El porcentaje puede tener como máximo un decimal.";
  if (p.percent === 0) return "El porcentaje no puede ser 0: no cambiaría ningún precio.";
  if (p.percent < minPercent || p.percent > maxPercent) {
    return `El porcentaje tiene que estar entre ${minPercent}% y +${maxPercent}%. Si necesitás un cambio mayor, hacelo en dos pasos.`;
  }
  if (!ROUNDING_OPTIONS.includes(p.rounding as (typeof ROUNDING_OPTIONS)[number])) return "El redondeo elegido no es válido.";
  if (typeof p.includeSale !== "boolean") return "Indicá si también se ajustan los precios en oferta.";
  if (!Array.isArray(p.types) || p.types.length === 0) return "Elegí al menos un tipo de producto.";
  if (p.types.some((t) => !PRODUCT_TYPES.includes(t as (typeof PRODUCT_TYPES)[number]))) return "Hay un tipo de producto que no existe.";
  if (typeof p.club !== "string" || p.club.length > 80) return "El equipo elegido no es válido.";
  return null;
}

/** Una actualización del historial, tal como la ve el panel. */
export type PriceChangeSummary = {
  id: number;
  createdAt: string;
  percent: number;
  rounding: number;
  scope: { types: string[]; club: string; includeSale: boolean };
  count: number;
  revertedAt: string | null;
};

/** "+8%" / "−10%" para mostrar. */
export function formatPercent(p: number): string {
  const n = Math.abs(p).toLocaleString("es-AR", { maximumFractionDigits: 1 });
  return `${p > 0 ? "+" : "−"}${n}%`;
}
