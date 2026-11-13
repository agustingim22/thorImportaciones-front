import { describe, expect, it } from "vitest";
import { allocateDiscount } from "@/lib/discountAllocation";

// Generador pseudoaleatorio con semilla fija: el test es reproducible.
function rng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1_664_525 + 1_013_904_223) % 4_294_967_296;
    return s / 4_294_967_296;
  };
}

describe("allocateDiscount (reparto del descuento entre ítems, para Mercado Pago)", () => {
  it("sin descuento devuelve el total de cada línea", () => {
    expect(allocateDiscount([{ unitPrice: 1000, quantity: 2 }, { unitPrice: 500, quantity: 1 }], 0)).toEqual([2000, 500]);
  });

  it("reparte proporcionalmente y la suma da exacto", () => {
    const r = allocateDiscount([{ unitPrice: 30_000, quantity: 1 }, { unitPrice: 10_000, quantity: 1 }], 4_000);
    expect(r.reduce((a, b) => a + b, 0)).toBe(36_000);
    expect(r).toEqual([27_000, 9_000]);
  });

  it("el resto del redondeo lo absorbe la última línea", () => {
    const r = allocateDiscount([{ unitPrice: 1, quantity: 1 }, { unitPrice: 1, quantity: 1 }, { unitPrice: 1, quantity: 1 }], 1);
    expect(r.reduce((a, b) => a + b, 0)).toBe(2);
  });

  it("un descuento mayor que el subtotal se recorta al subtotal", () => {
    const r = allocateDiscount([{ unitPrice: 1000, quantity: 1 }], 99_999);
    expect(r).toEqual([0]);
  });

  it("2.000 casos al azar: la suma siempre es subtotal − descuento y ninguna línea queda negativa", () => {
    const rand = rng(12345);
    for (let n = 0; n < 2000; n++) {
      const lines = Array.from({ length: 1 + Math.floor(rand() * 5) }, () => ({
        unitPrice: 1000 + Math.floor(rand() * 90_000),
        quantity: 1 + Math.floor(rand() * 4),
      }));
      const subtotal = lines.reduce((s, l) => s + l.unitPrice * l.quantity, 0);
      const discount = Math.floor(rand() * (subtotal + 1));
      const result = allocateDiscount(lines, discount);
      expect(result.reduce((a, b) => a + b, 0)).toBe(subtotal - discount);
      expect(result.every((x) => x >= 0)).toBe(true);
    }
  });
});
