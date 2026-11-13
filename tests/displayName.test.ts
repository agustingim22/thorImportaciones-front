import { describe, expect, it } from "vitest";
import { displayName } from "@/lib/displayName";
import { productDescription, productTitle, sizeRange } from "@/lib/seo";

// Nombres que lee el cliente: se arman a partir del título en inglés del proveedor.
describe("nombre para el cliente (displayName)", () => {
  it.each([
    ["26-27 RMA Away 1:1 Fans Soccer Jersey", "fan", "Real Madrid · Visitante 26/27 · 1:1"],
    ["1999-2000 Roma Third Long Sleeve Retro Soccer Jersey", "retro", "Roma · Alternativa Manga larga 1999/00 · Retro"],
    ["26-27 Boca Juniors Home Player Version Soccer Jersey", "player", "Boca Juniors · Local 26/27 · Versión jugador"],
    ["26-27 Argentina Home Fans Soccer Jersey", "fan", "Argentina · Local 26/27"],
    ["26-27 Algeria Home Shorts Pants", "pantalon", "Argelia · Short Local 26/27"],
    ["25-26 Real Betis Away Fans Soccer Jersey", "fan", "Real Betis · Visitante 25/26"],
    ["1996-1997 Hamburg SV Home Retro Soccer Jersey", "retro", "Hamburg SV · Local 1996/97 · Retro"],
    ["26-27 Brazil Away Training Shirts", "fan", "Brasil · Visitante Entrenamiento 26/27"],
  ])("%s (%s) → %s", (team, type, expected) => {
    expect(displayName(team, type)).toBe(expected);
  });

  it("no se rompe con un nombre vacío", () => {
    expect(typeof displayName("", "fan")).toBe("string");
  });
});

describe("títulos y descripciones para Google", () => {
  it("un nombre corto va con el sufijo de la marca (lo agrega el layout)", () => {
    expect(productTitle("Boca Juniors · Local 26/27")).toBe("Boca Juniors · Local 26/27");
  });

  it("un nombre largo va sin sufijo, y nunca pasa de 66 caracteres", () => {
    const long = "Real Madrid · Edición especial Entrenamiento Manga larga 2025/26 · Versión jugador · 1:1";
    const t = productTitle(long);
    const title = typeof t === "string" ? t : t.absolute;
    expect(title.length).toBeLessThanOrEqual(66);
  });

  it("al cortar prefiere el último ' · ' entero antes que cortar una palabra", () => {
    const t = productTitle("Real Madrid · Visitante 26/27 · Versión jugador · Edición especial limitada de aniversario");
    const title = typeof t === "string" ? t : t.absolute;
    expect(title.endsWith("…")).toBe(false);
    expect(title.startsWith("Real Madrid · Visitante 26/27")).toBe(true);
  });

  it("un nombre sin separadores y larguísimo se corta con puntos suspensivos", () => {
    const t = productTitle("X".repeat(120));
    const title = typeof t === "string" ? t : t.absolute;
    expect(title.length).toBeLessThanOrEqual(66);
    expect(title.endsWith("…")).toBe(true);
  });

  it("rango de talles", () => {
    expect(sizeRange(["M", "S", "XL", "L", "XXL"])).toBe("S a XXL");
    expect(sizeRange(["M"])).toBe("M");
    expect(sizeRange([])).toBe("");
  });

  it("la descripción cargada a mano gana; si no, se arma con nombre, versión y talles", () => {
    const base = { name: "Boca Juniors · Local 26/27", type: "fan" as const, sizes: ["S", "M", "L"] };
    expect(productDescription({ ...base, description: "  Hecha a mano  " })).toBe("Hecha a mano");
    const generated = productDescription({ ...base, description: "" });
    expect(generated).toContain("Boca Juniors · Local 26/27");
    expect(generated).toContain("Talles S a L");
    expect(generated).toContain("Thor Importaciones");
  });
});
