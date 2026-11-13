import { describe, expect, it } from "vitest";
import {
  BUNDLE_OFF,
  activeTier,
  bestDiscount,
  bundleDiscount,
  bundleTiers,
  nextTier,
  unitsToUnlock,
  type BundleSettings,
} from "@/lib/bundle";
import { validateBundle } from "@/lib/server/bundle";

const one: BundleSettings = { enabled: true, minQty: 3, percent: 20, minQty2: null, percent2: null };
const two: BundleSettings = { enabled: true, minQty: 2, percent: 10, minQty2: 4, percent2: 20 };

describe("combo con un escalón", () => {
  it("descuenta el % del subtotal desde la cantidad mínima", () => {
    expect(bundleDiscount(100_000, 3, one)).toBe(20_000);
    expect(bundleDiscount(100_000, 9, one)).toBe(20_000);
  });
  it("no descuenta por debajo de la cantidad mínima", () => {
    expect(bundleDiscount(100_000, 2, one)).toBe(0);
  });
  it("apagado no descuenta nunca", () => {
    expect(bundleDiscount(100_000, 9, { ...one, enabled: false })).toBe(0);
    expect(bundleDiscount(100_000, 9, BUNDLE_OFF)).toBe(0);
  });
  it("redondea al peso y nunca pasa del subtotal", () => {
    expect(bundleDiscount(33_333, 3, one)).toBe(6_667);
    expect(bundleDiscount(0, 3, one)).toBe(0);
  });
  it("faltan N unidades para el escalón", () => {
    expect(unitsToUnlock(1, one)).toBe(2);
    expect(unitsToUnlock(3, one)).toBe(0);
  });
});

describe("combo con dos escalones", () => {
  it("rige el escalón más alto que alcanza el carrito", () => {
    expect(bundleDiscount(100_000, 1, two)).toBe(0);
    expect(bundleDiscount(100_000, 2, two)).toBe(10_000);
    expect(bundleDiscount(100_000, 3, two)).toBe(10_000);
    expect(bundleDiscount(100_000, 4, two)).toBe(20_000);
    expect(bundleDiscount(100_000, 10, two)).toBe(20_000);
  });
  it("activeTier y nextTier", () => {
    expect(activeTier(1, two)).toBeNull();
    expect(activeTier(3, two)).toEqual({ minQty: 2, percent: 10 });
    expect(nextTier(1, two)).toEqual({ minQty: 2, percent: 10 });
    expect(nextTier(2, two)).toEqual({ minQty: 4, percent: 20 });
    expect(nextTier(4, two)).toBeNull();
  });
  it("cuántas faltan para el próximo escalón", () => {
    expect(unitsToUnlock(1, two)).toBe(1);
    expect(unitsToUnlock(2, two)).toBe(2);
    expect(unitsToUnlock(3, two)).toBe(1);
    expect(unitsToUnlock(4, two)).toBe(0);
  });
  it("un segundo escalón incoherente (no mejora al primero) se ignora", () => {
    expect(bundleTiers({ ...two, percent2: 5 })).toHaveLength(1);
    expect(bundleTiers({ ...two, minQty2: 2 })).toHaveLength(1);
    expect(bundleTiers({ ...two, minQty2: null })).toHaveLength(1);
  });
});

describe("cupón vs combo (no se acumulan)", () => {
  it("rige el que más descuenta", () => {
    expect(bestDiscount(900, 500)).toEqual({ amount: 900, source: "coupon" });
    expect(bestDiscount(500, 900)).toEqual({ amount: 900, source: "bundle" });
  });
  it("en un empate rige el combo (así el cupón no se gasta)", () => {
    expect(bestDiscount(500, 500)).toEqual({ amount: 500, source: "bundle" });
  });
  it("sin ninguno de los dos no hay descuento", () => {
    expect(bestDiscount(0, 0)).toEqual({ amount: 0, source: null });
  });
  it("solo cupón o solo combo", () => {
    expect(bestDiscount(700, 0).source).toBe("coupon");
    expect(bestDiscount(0, 700).source).toBe("bundle");
  });
});

describe("validación de la configuración que manda el admin", () => {
  const ok = { enabled: true, minQty: 2, percent: 10 };
  it("acepta una configuración válida, con o sin segundo escalón", () => {
    expect(validateBundle(ok)).toBeNull();
    expect(validateBundle({ ...ok, minQty2: 4, percent2: 20 })).toBeNull();
    expect(validateBundle({ ...ok, minQty2: null, percent2: null })).toBeNull();
  });
  it("rechaza valores fuera de rango o no enteros", () => {
    expect(validateBundle({ ...ok, enabled: "si" as unknown as boolean })).not.toBeNull();
    expect(validateBundle({ ...ok, minQty: 1 })).not.toBeNull();
    expect(validateBundle({ ...ok, minQty: 11 })).not.toBeNull();
    expect(validateBundle({ ...ok, percent: 0 })).not.toBeNull();
    expect(validateBundle({ ...ok, percent: 51 })).not.toBeNull();
    expect(validateBundle({ ...ok, percent: 10.5 })).not.toBeNull();
  });
  it("el segundo escalón va completo y tiene que mejorar al primero", () => {
    expect(validateBundle({ ...ok, minQty2: 4 })).not.toBeNull();
    expect(validateBundle({ ...ok, percent2: 20 })).not.toBeNull();
    expect(validateBundle({ ...ok, minQty2: 2, percent2: 20 })).not.toBeNull();
    expect(validateBundle({ ...ok, minQty2: 4, percent2: 10 })).not.toBeNull();
    expect(validateBundle({ ...ok, minQty2: 11, percent2: 20 })).not.toBeNull();
    expect(validateBundle({ ...ok, minQty2: 4, percent2: 51 })).not.toBeNull();
    expect(validateBundle({ ...ok, minQty2: 4, percent2: 20.5 })).not.toBeNull();
  });
});
