/**
 * Descuento por cantidad ("combo"). Sin "server-only": lo usan el carrito (en el navegador, para mostrar el
 * total) y el servidor, que es el que manda: el pedido siempre se recalcula allá.
 *
 * Regla: si el combo está encendido y el carrito tiene `minQty` unidades o más, se descuenta `percent`% del
 * subtotal de productos. Opcionalmente hay un segundo escalón (`minQty2` / `percent2`) con más unidades y más
 * descuento: rige el más alto que alcance el carrito. No se acumula con un cupón: se aplica el que más
 * descuenta (el otro no se gasta).
 */
export type BundleSettings = {
  enabled: boolean;
  minQty: number; // unidades desde las que aplica el primer escalón
  percent: number; // % de descuento del primer escalón
  minQty2: number | null; // segundo escalón (opcional): unidades…
  percent2: number | null; // …y % de descuento. Los dos van juntos: o están los dos o ninguno.
};

export const BUNDLE_OFF: BundleSettings = { enabled: false, minQty: 2, percent: 10, minQty2: null, percent2: null };

export const BUNDLE_LIMITS = { minQty: { min: 2, max: 10 }, percent: { min: 1, max: 50 } } as const;

export type BundleTier = { minQty: number; percent: number };

/** Los escalones del combo de menor a mayor (1 o 2). Vacío si está apagado. */
export function bundleTiers(s: BundleSettings): BundleTier[] {
  if (!s.enabled || s.percent <= 0) return [];
  const tiers: BundleTier[] = [{ minQty: s.minQty, percent: s.percent }];
  if (s.minQty2 != null && s.percent2 != null && s.minQty2 > s.minQty && s.percent2 > s.percent) {
    tiers.push({ minQty: s.minQty2, percent: s.percent2 });
  }
  return tiers;
}

/** El escalón más alto que alcanza un carrito con `units` unidades, o null si no llega a ninguno. */
export function activeTier(units: number, s: BundleSettings): BundleTier | null {
  const reached = bundleTiers(s).filter((t) => units >= t.minQty);
  return reached.length > 0 ? reached[reached.length - 1] : null;
}

/** El próximo escalón que todavía no alcanza (para decirle "sumá N más"), o null si ya está en el último. */
export function nextTier(units: number, s: BundleSettings): BundleTier | null {
  return bundleTiers(s).find((t) => units < t.minQty) ?? null;
}

/** Monto que descuenta el combo para un subtotal y una cantidad de unidades (0 si no aplica). */
export function bundleDiscount(subtotal: number, units: number, s: BundleSettings): number {
  const tier = activeTier(units, s);
  if (!tier) return 0;
  return Math.max(0, Math.min(subtotal, Math.round((subtotal * tier.percent) / 100)));
}

/** Cuántas unidades más le faltan al carrito para el próximo escalón (0 si ya está en el último o está apagado). */
export function unitsToUnlock(units: number, s: BundleSettings): number {
  const next = nextTier(units, s);
  return next ? next.minQty - units : 0;
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
    return { ...BUNDLE_OFF, ...((await res.json()) as Partial<BundleSettings>) };
  } catch {
    return BUNDLE_OFF;
  }
}
