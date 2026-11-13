import { describe, expect, it, vi } from "vitest";

// coupons.ts importa la base de datos; para estos tests no hace falta (son cuentas puras).
vi.mock("@/lib/prisma", () => ({ prisma: {} }));
vi.mock("../src/lib/prisma", () => ({ prisma: {} }));

const { computeDiscount } = await import("@/lib/coupons");

describe("cupones: monto de descuento", () => {
  it("porcentaje, redondeado al peso", () => {
    expect(computeDiscount({ type: "percentage", value: 10 }, 50_000)).toBe(5_000);
    expect(computeDiscount({ type: "percentage", value: 15 }, 33_333)).toBe(5_000);
  });
  it("monto fijo", () => {
    expect(computeDiscount({ type: "fixed", value: 3_000 }, 50_000)).toBe(3_000);
  });
  it("nunca descuenta más que el subtotal (el total no queda negativo)", () => {
    expect(computeDiscount({ type: "fixed", value: 99_000 }, 50_000)).toBe(50_000);
    expect(computeDiscount({ type: "percentage", value: 100 }, 50_000)).toBe(50_000);
  });
  it("valores raros no dan descuento negativo", () => {
    expect(computeDiscount({ type: "fixed", value: -500 }, 50_000)).toBe(0);
  });
});
