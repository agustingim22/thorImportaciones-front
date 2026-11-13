/**
 * Actualización de precios por porcentaje, contra una base de datos real: vista previa, aplicar (todo o nada),
 * rechazo si algo cambió, deshacer y permisos. Escribe y borra datos: solo corre con TEST_DATABASE_URL apuntando a una
 * base en localhost (ver orders.integration.test.ts). Los productos de prueba llevan un equipo exclusivo para que el
 * cambio nunca toque otros productos de la base.
 */
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

const url = process.env.TEST_DATABASE_URL ?? "";
const isLocal = /^postgres(ql)?:\/\/[^@]*@(localhost|127\.0\.0\.1)[:/]/.test(url);
const run = isLocal ? describe : describe.skip;

vi.mock("next/cache", () => ({ revalidatePath: () => {}, revalidateTag: () => {}, unstable_cache: <T>(fn: T) => fn }));

type Db = typeof import("@/lib/prisma").prisma;
let prisma: Db;
let route: typeof import("@/app/api/admin/prices/route");
let undoRoute: typeof import("@/app/api/admin/prices/undo/route");

const CLUB = `itest-club-${Date.now()}`;
const TOKEN = process.env.ADMIN_TOKEN!;
const ids: Record<string, number> = {};
const createdBatches: number[] = [];

const params = { percent: 10, rounding: 100, includeSale: true, types: ["fan", "retro"], club: CLUB };
const auth = { authorization: `Bearer ${TOKEN}` };

const call = (handler: (r: Request) => Promise<Response>, method: string, body?: unknown, headers: Record<string, string> = auth) =>
  handler(
    new Request("http://localhost/api/admin/prices", {
      method,
      headers: { "content-type": "application/json", ...headers },
      body: body === undefined ? undefined : JSON.stringify(body),
    }),
  );
const post = (body: unknown, headers?: Record<string, string>) => call(route.POST, "POST", body, headers);
const prices = async () =>
  Object.fromEntries(
    (await prisma.product.findMany({ where: { id: { in: Object.values(ids) } } })).map((p) => {
      const k = Object.keys(ids).find((key) => ids[key] === p.id)!;
      return [k, { price: p.price, salePrice: p.salePrice }];
    }),
  );

async function preview(p = params) {
  const res = await post({ ...p, mode: "preview" });
  return { status: res.status, json: (await res.json()) as Record<string, any> }; // eslint-disable-line @typescript-eslint/no-explicit-any
}
async function apply(expect: { count: number; sumNew: number }, p = params) {
  const res = await post({ ...p, mode: "apply", expect });
  const json = (await res.json()) as Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any
  if (typeof json.id === "number") createdBatches.push(json.id);
  return { status: res.status, json };
}

run("actualizador de precios (integración con base de datos)", () => {
  beforeAll(async () => {
    process.env.DATABASE_URL = url;
    process.env.DIRECT_URL = url;
    ({ prisma } = await import("@/lib/prisma"));
    route = await import("@/app/api/admin/prices/route");
    undoRoute = await import("@/app/api/admin/prices/undo/route");

    const mk = async (key: string, data: { type: string; price: number; salePrice?: number | null; club?: string }) => {
      const p = await prisma.product.create({
        data: {
          slug: `${CLUB}-${key}`, team: `26-27 ${CLUB} ${key} Home`, type: data.type, price: data.price, salePrice: data.salePrice ?? null,
          colorCss: "#000", images: [], description: "", stock: 5, sizes: ["M"], club: data.club ?? CLUB, clubManual: true,
        },
      });
      ids[key] = p.id;
    };
    await mk("fan1", { type: "fan", price: 40_000 });
    await mk("fan2", { type: "fan", price: 50_000, salePrice: 45_000 });
    await mk("retro", { type: "retro", price: 43_500 });
    await mk("short", { type: "pantalon", price: 32_100 }); // mismo equipo pero otro tipo: no entra
    await mk("otro", { type: "fan", price: 40_000, club: `${CLUB}-otro` }); // otro equipo: no entra
  });

  afterAll(async () => {
    if (!prisma) return;
    await prisma.priceChange.deleteMany({ where: { id: { in: createdBatches } } });
    await prisma.priceChange.deleteMany({ where: { scope: { path: ["itest"], equals: CLUB } } }); // las filas sintéticas de la prueba de las 20 últimas
    await prisma.product.deleteMany({ where: { id: { in: Object.values(ids) } } });
    await prisma.$disconnect();
  });

  it("la vista previa calcula sin cambiar nada", async () => {
    const before = await prices();
    const { status, json } = await preview();
    expect(status).toBe(200);
    expect(json.count).toBe(3);
    expect(json.withSale).toBe(1);
    expect(json.minNew).toBe(44_000);
    expect(json.maxNew).toBe(55_000);
    expect(json.sample).toHaveLength(3);
    expect(json.expect.count).toBe(3);
    expect(await prices()).toEqual(before);
  });

  it("sin permisos no se puede ver ni cambiar nada", async () => {
    expect((await call(route.GET, "GET", undefined, {})).status).toBe(401);
    expect((await post({ ...params, mode: "preview" }, {})).status).toBe(401);
    expect((await post({ ...params, mode: "preview" }, { authorization: "Bearer mal" })).status).toBe(401);
    expect((await call(undoRoute.POST, "POST", undefined, {})).status).toBe(401);
  });

  it("datos inválidos se rechazan con un mensaje claro", async () => {
    for (const bad of [{ percent: 0 }, { percent: 500 }, { percent: 1.25 }, { types: [] }, { rounding: 7 }, { includeSale: "si" }]) {
      const { status, json } = await preview({ ...params, ...bad } as typeof params);
      expect(status, JSON.stringify(bad)).toBe(400);
      expect(typeof json.error).toBe("string");
    }
    expect((await post({ ...params, mode: "borrar" })).status).toBe(400);
    expect((await post({ ...params, mode: "apply" })).status).toBe(400); // sin haber visto la vista previa
    const garbage = await route.POST(new Request("http://localhost/api/admin/prices", { method: "POST", headers: auth, body: "no es json" }));
    expect(garbage.status).toBe(400);
  });

  it("aplica solo a los productos del tipo y el equipo elegidos, y escala la oferta", async () => {
    const before = await prices();
    const { json: pv } = await preview();
    const { status, json } = await apply(pv.expect);
    expect(status).toBe(200);
    expect(json.count).toBe(3);
    const after = await prices();
    expect(after.fan1).toEqual({ price: 44_000, salePrice: null });
    expect(after.fan2).toEqual({ price: 55_000, salePrice: 49_500 });
    expect(after.retro).toEqual({ price: 47_900, salePrice: null }); // 43.500 × 1,10 = 47.850 → 47.900
    expect(after.short).toEqual(before.short); // otro tipo
    expect(after.otro).toEqual(before.otro); // otro equipo
    expect(json.history[0].id).toBe(json.id);
    expect(json.undoableId).toBe(json.id);
    expect(json.history[0]).toMatchObject({ percent: 10, rounding: 100, count: 3, revertedAt: null });
  });

  it("el historial muestra la actualización y se puede pedir por separado", async () => {
    const res = await call(route.GET, "GET");
    const json = (await res.json()) as { history: { id: number }[]; undoableId: number };
    expect(res.status).toBe(200);
    expect(json.history.some((h) => h.id === createdBatches[0])).toBe(true);
  });

  it("deshacer vuelve todo a como estaba", async () => {
    const res = await call(undoRoute.POST, "POST");
    const json = (await res.json()) as Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any
    expect(res.status).toBe(200);
    expect(json.reverted).toBe(3);
    expect(json.skipped).toBe(0);
    const after = await prices();
    expect(after.fan1).toEqual({ price: 40_000, salePrice: null });
    expect(after.fan2).toEqual({ price: 50_000, salePrice: 45_000 });
    expect(after.retro).toEqual({ price: 43_500, salePrice: null });
    const batch = json.history.find((h: { id: number }) => h.id === createdBatches[0]);
    expect(batch.revertedAt).toBeTruthy();
    expect(json.undoableId).not.toBe(createdBatches[0]); // una actualización deshecha no se puede deshacer dos veces
  });

  it("si un producto cambió después de la vista previa, no se aplica nada", async () => {
    const { json: pv } = await preview();
    await prisma.product.update({ where: { id: ids.fan1 }, data: { price: 41_000 } });
    const before = await prices();
    const { status, json } = await apply(pv.expect);
    expect(status).toBe(409);
    expect(json.error).toMatch(/vista previa/);
    expect(await prices()).toEqual(before);
    await prisma.product.update({ where: { id: ids.fan1 }, data: { price: 40_000 } });
  });

  it("un cambio con una vista previa inventada también se rechaza", async () => {
    const { status } = await apply({ count: 3, sumNew: 1 });
    expect(status).toBe(409);
    expect((await prices()).fan1.price).toBe(40_000);
  });

  it("al deshacer no pisa los precios que se editaron a mano después", async () => {
    const { json: pv } = await preview();
    expect((await apply(pv.expect)).status).toBe(200);
    await prisma.product.update({ where: { id: ids.fan1 }, data: { price: 99_900 } }); // edición manual posterior
    const res = await call(undoRoute.POST, "POST");
    const json = (await res.json()) as Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any
    expect(json.reverted).toBe(2);
    expect(json.skipped).toBe(1);
    const after = await prices();
    expect(after.fan1.price).toBe(99_900); // la edición manual se respeta
    expect(after.fan2).toEqual({ price: 50_000, salePrice: 45_000 });
    expect(after.retro.price).toBe(43_500);
  });

  it("sin ajustar las ofertas, el precio en oferta no se toca", async () => {
    await prisma.product.update({ where: { id: ids.fan1 }, data: { price: 40_000 } });
    const p = { ...params, includeSale: false };
    const { json: pv } = await preview(p);
    expect((await apply(pv.expect, p)).status).toBe(200);
    expect((await prices()).fan2).toEqual({ price: 55_000, salePrice: 45_000 });
    expect((await call(undoRoute.POST, "POST")).status).toBe(200);
  });

  it("si no hay nada que cambiar, avisa", async () => {
    const p = { ...params, club: `${CLUB}-vacio` };
    const { json } = await preview(p);
    expect(json.count).toBe(0);
    const { status } = await apply({ count: 0, sumNew: 0 }, p);
    expect(status).toBe(400);
  });

  it("filtra por 'sin equipo': nunca entra un producto que sí tiene equipo", async () => {
    const { json } = await preview({ ...params, club: "none", types: ["pantalon"] });
    // En la base puede haber productos sin equipo de otras pruebas; lo que importa es que los de este equipo no estén.
    const sample = (json.sample as { team: string }[]).map((s) => s.team);
    expect(sample.some((t) => t.includes(CLUB))).toBe(false);
  });

  it("solo se guardan las últimas 20 actualizaciones", async () => {
    await prisma.priceChange.createMany({
      data: Array.from({ length: 22 }, () => ({ percent: 1, rounding: 1, scope: { itest: CLUB }, count: 0, items: [], revertedAt: new Date() })),
    });
    const { json: pv } = await preview();
    const { status, json } = await apply(pv.expect);
    expect(status).toBe(200);
    expect(await prisma.priceChange.count()).toBeLessThanOrEqual(20);
    expect(await prisma.priceChange.findUnique({ where: { id: json.id } })).not.toBeNull(); // la nueva se conserva
    expect((await call(undoRoute.POST, "POST")).status).toBe(200);
  });
});
