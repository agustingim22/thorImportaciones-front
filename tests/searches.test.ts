import { beforeEach, describe, expect, it, vi } from "vitest";

const upsert = vi.fn<(arg: unknown) => Promise<unknown>>();
const deleteMany = vi.fn<(arg: unknown) => Promise<{ count: number }>>(async () => ({ count: 3 }));
vi.mock("@/lib/prisma", () => ({ prisma: { searchTerm: { upsert: (arg: unknown) => upsert(arg), deleteMany: (arg: unknown) => deleteMany(arg) } } }));

const { normalizeSearch, isBotUserAgent, logSearch, pruneSearchTerms } = await import("@/lib/server/searches");

beforeEach(() => {
  upsert.mockReset();
  deleteMany.mockClear();
});

describe("búsquedas de los clientes", () => {
  it("normaliza: minúsculas, sin tildes ni espacios de más", () => {
    expect(normalizeSearch("  México  ")).toBe("mexico");
    expect(normalizeSearch("REAL   Madrid")).toBe("real madrid");
    expect(normalizeSearch("España")).toBe("espana");
  });

  it("reconoce bots y navegadores comunes", () => {
    expect(isBotUserAgent("Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)")).toBe(true);
    expect(isBotUserAgent("facebookexternalhit/1.1")).toBe(true);
    expect(isBotUserAgent("Mozilla/5.0 (Linux; Android 13) HeadlessChrome/120")).toBe(true);
    expect(isBotUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36")).toBe(false);
    expect(isBotUserAgent(null)).toBe(false);
  });

  it("anota la búsqueda normalizada con su cantidad de resultados", async () => {
    await logSearch("  Boca  ", 12);
    expect(upsert).toHaveBeenCalledTimes(1);
    const arg = upsert.mock.calls[0][0] as { where: { term: string }; create: { results: number }; update: { searches: { increment: number } } };
    expect(arg.where.term).toBe("boca");
    expect(arg.create.results).toBe(12);
    expect(arg.update.searches.increment).toBe(1);
  });

  it("ignora textos de menos de 2 o más de 60 caracteres", async () => {
    await logSearch("a", 0);
    await logSearch("x".repeat(61), 0);
    await logSearch("   ", 0);
    expect(upsert).not.toHaveBeenCalled();
  });

  it("si la base falla, no rompe la página", async () => {
    upsert.mockRejectedValueOnce(new Error("base caída"));
    await expect(logSearch("boca", 5)).resolves.toBeUndefined();
  });

  it("la limpieza borra solo las de una sola vez con más de 60 días", async () => {
    const before = Date.now();
    const removed = await pruneSearchTerms();
    expect(removed).toBe(3);
    const arg = deleteMany.mock.calls[0][0] as { where: { searches: { lte: number }; lastAt: { lt: Date } } };
    expect(arg.where.searches.lte).toBe(1);
    const ageDays = (before - arg.where.lastAt.lt.getTime()) / 86_400_000;
    expect(ageDays).toBeGreaterThan(59.9);
    expect(ageDays).toBeLessThan(60.1);
  });
});
