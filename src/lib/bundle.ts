/**
 * Descuento por cantidad ("combo"). Sin "server-only": lo usan el carrito (en el navegador, para mostrar el
 * total) y el servidor, que es el que manda: el pedido siempre se recalcula allá.
 *
 * Regla: si el combo está encendido y el carrito tiene `minQty` unidades o más, se descuenta `percent`% del
 * subtotal de productos. No se acumula con un cupón: se aplica el que más descuenta (el otro no se gasta).
 */
export type BundleSettings = {
  enabled: boolean;
  minQty: number; // unidades desde las que aplica
  percent: number; // % de descuento
};

export const BUNDLE_OFF: BundleSettings = { enabled: false, minQty: 2, percent: 10 };

export const BUNDLE_LIMITS = { minQty: { min: 2, max: 10 }, percent: { min: 1, max: 50 } } as const;

/** Monto que descuenta el combo para un subtotal y una cantidad de unidades (0 si no aplica). */
export function bundleDiscount(subtotal: number, units: number, s: BundleSettings): number {
  if (!s.enabled || s.percent <= 0 || units < s.minQty) return 0;
  return Math.max(0, Math.min(subtotal, Math.round((subtotal * s.percent) / 100)));
}

/** Cuántas unidades más le faltan al carrito para que aplique el combo (0 si ya aplica o está apagado). */
export function unitsToUnlock(units: number, s: BundleSettings): number {
  if (!s.enabled || units >= s.minQty) return 0;
  return s.minQty - units;
}

export type DiscountSource = "coupon" | "bundle" | null;

/** Entre el cupón y el combo se aplica el que más descuenta; en un empate, el combo (así no se gasta el cupón). */
export function bestDiscount(couponAmount: number, bundleAmount: number): { amount: number; source: DiscountSource } {
  if (bundleAmount <= 0 && couponAmount <= 0) return { amount: 0, source: null };
  return bundleAmount >= couponAmount
    ? { amount: bundleAmount, source: "bundle" }
    : { amount: couponAmount, source: "coupon" };
}

/** Pide la configuración del combo al servidor; si falla, el combo queda apagado. */
export async function fetchBundleSettings(): Promise<BundleSettings> {
  try {
    const res = await fetch("/api/bundle", { cache: "no-store" });
    if (!res.ok) return BUNDLE_OFF;
    return (await res.json()) as BundleSettings;
  } catch {
    return BUNDLE_OFF;
  }
}
