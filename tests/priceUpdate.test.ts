import { describe, expect, it } from "vitest";
import { PRODUCT_TYPES } from "@/lib/api";
import {
  ROUNDING_OPTIONS,
  computeChanges,
  expectationOf,
  formatPercent,
  newPrice,
  validatePriceParams,
  type PriceUpdateParams,
} from "@/lib/priceUpdate";

const ok: PriceUpdateParams = { percent: 8, rounding: 100, includeSale: true, types: ["fan"], club: "" };

describe("precio nuevo", () => {
  it("aplica el porcentaje y redondea al múltiplo más cercano", () => {
    expect(newPrice(43_500, 8, 1)).toBe(46_980);
    expect(newPrice(43_500, 8, 100)).toBe(47_000);
    expect(newPrice(43_500, 8, 500)).toBe(47_000);
    expect(newPrice(43_500, 8, 1000)).toBe(47_000);
  });
  it("baja con porcentaje negativo", () => {
    expect(newPrice(43_500, -10, 1)).toBe(39_150);
    expect(newPrice(43_500, -10, 100)).toBe(39_200); // 391,5 → 392
    expect(newPrice(37_000, -50, 100)).toBe(18_500);
  });
  it("acepta un decimal sin errores de coma flotante", () => {
    expect(newPrice(32_100, 7.5, 1)).toBe(34_508); // 34.507,5 sube al entero siguiente
    expect(newPrice(10_000, 0.1, 1)).toBe(10_010);
    expect(newPrice(10_000, 33.3, 1)).toBe(13_330);
    expect(newPrice(56_100, 12.7, 1)).toBe(63_225); // 63.224,7
  });
  it("el redondeo nunca sale de la grilla", () => {
    for (const price of [32_100, 37_000, 43_500, 56_100, 1_234]) {
      for (const step of [100, 500, 1000]) {
        expect(newPrice(price, 6.3, step) % step).toBe(0);
      }
    }
  });
});

describe("qué productos cambian", () => {
  const rows = [
    { id: 1, price: 40_000, salePrice: null },
    { id: 2, price: 50_000, salePrice: 45_000 },
    { id: 3, price: 100, salePrice: null },
  ];

  it("calcula precio y precio en oferta con el mismo porcentaje", () => {
    const r = computeChanges(rows, { percent: 10, rounding: 100, includeSale: true });
    expect(r.find((c) => c.id === 1)).toEqual({ id: 1, price: 40_000, salePrice: null, newPrice: 44_000, newSalePrice: null });
    expect(r.find((c) => c.id === 2)).toEqual({ id: 2, price: 50_000, salePrice: 45_000, newPrice: 55_000, newSalePrice: 49_500 });
  });
  it("sin ajustar las ofertas, el precio en oferta queda como estaba", () => {
    const r = computeChanges(rows, { percent: 10, rounding: 100, includeSale: false });
    expect(r.find((c) => c.id === 2)).toMatchObject({ newPrice: 55_000, newSalePrice: 45_000 });
  });
  it("los que quedan igual por el redondeo no cambian", () => {
    const r = computeChanges([{ id: 9, price: 40_000, salePrice: null }], { percent: 0.1, rounding: 500, includeSale: true });
    expect(r).toEqual([]); // +0,1% son $40: se redondea a $40.000
  });
  it("nunca deja un precio en cero o negativo", () => {
    const r = computeChanges([{ id: 3, price: 100, salePrice: null }], { percent: -50, rounding: 500, includeSale: true });
    expect(r).toEqual([]); // $50 redondeado a $500 daría $0 (o $500: más que antes): se omite
  });
  it("la expectativa (cantidad y suma) cambia si cambia cualquier precio", () => {
    const base = expectationOf(computeChanges(rows, { percent: 10, rounding: 100, includeSale: true }));
    const edited = expectationOf(
      computeChanges([{ ...rows[0], price: 40_100 }, rows[1], rows[2]], { percent: 10, rounding: 100, includeSale: true }),
    );
    expect(base.count).toBe(edited.count);
    expect(base.sumNew).not.toBe(edited.sumNew);
  });
});

describe("validación de los datos del formulario", () => {
  it("acepta datos correctos", () => {
    expect(validatePriceParams(ok)).toBeNull();
    expect(validatePriceParams({ ...ok, percent: -10, club: "boca-juniors" })).toBeNull();
    expect(validatePriceParams({ ...ok, percent: -50 })).toBeNull();
    expect(validatePriceParams({ ...ok, percent: 100 })).toBeNull();
    expect(validatePriceParams({ ...ok, percent: 7.5, club: "none", types: [...PRODUCT_TYPES] })).toBeNull();
  });
  it("rechaza porcentajes inválidos", () => {
    for (const percent of [0, -50.1, 100.1, 250, -90, 1.25, NaN, Infinity]) {
      expect(validatePriceParams({ ...ok, percent }), String(percent)).not.toBeNull();
    }
    expect(validatePriceParams({ ...ok, percent: "8" as unknown as number })).not.toBeNull();
    expect(validatePriceParams({ ...ok, percent: undefined })).not.toBeNull();
  });
  it("rechaza redondeos que no están en la lista", () => {
    for (const r of ROUNDING_OPTIONS) expect(validatePriceParams({ ...ok, rounding: r })).toBeNull();
    expect(validatePriceParams({ ...ok, rounding: 250 })).not.toBeNull();
    expect(validatePriceParams({ ...ok, rounding: 0 })).not.toBeNull();
  });
  it("exige al menos un tipo y que existan", () => {
    expect(validatePriceParams({ ...ok, types: [] })).not.toBeNull();
    expect(validatePriceParams({ ...ok, types: ["fan", "inventado"] })).not.toBeNull();
    expect(validatePriceParams({ ...ok, types: undefined })).not.toBeNull();
  });
  it("valida includeSale y el equipo", () => {
    expect(validatePriceParams({ ...ok, includeSale: "si" as unknown as boolean })).not.toBeNull();
    expect(validatePriceParams({ ...ok, club: 5 as unknown as string })).not.toBeNull();
    expect(validatePriceParams({ ...ok, club: "x".repeat(81) })).not.toBeNull();
  });
});

describe("formato", () => {
  it("muestra el signo y los decimales a la argentina", () => {
    expect(formatPercent(8)).toBe("+8%");
    expect(formatPercent(-10)).toBe("−10%");
    expect(formatPercent(7.5)).toBe("+7,5%");
  });
});
