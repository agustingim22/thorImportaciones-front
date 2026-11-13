/**
 * Pedidos de punta a punta contra una base de datos real: precios, stock, combo, cupones y envío.
 *
 * Escribe y borra datos, así que NO corre salvo que se pida explícitamente con TEST_DATABASE_URL, y solo acepta
 * una base en localhost (nunca la de producción):
 *
 *   TEST_DATABASE_URL=postgresql://usuario:clave@localhost:5432/thor npm test
 *
 * En GitHub Actions la define el workflow con una base Postgres efímera.
 */
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

const url = process.env.TEST_DATABASE_URL ?? "";
const isLocal = /^postgres(ql)?:\/\/[^@]*@(localhost|127\.0\.0\.1)[:/]/.test(url);
const run = isLocal ? describe : describe.skip;

// Next.js no está corriendo: se reemplaza lo que depende de su servidor.
vi.mock("@/lib/server/session", () => ({ getSessionUser: async () => null }));
vi.mock("next/cache", () => ({ revalidatePath: () => {}, revalidateTag: () => {}, unstable_cache: <T>(fn: T) => fn }));

type Db = typeof import("@/lib/prisma").prisma;
let prisma: Db;
let POST: (req: Request) => Promise<Response>;

const TAG = `itest-${Date.now()}`;
const created: { productIds: number[]; couponIds: number[]; orderIds: string[] } = { productIds: [], couponIds: [], orderIds: [] };
let prevBundle: Awaited<ReturnType<Db["bundleSettings"]["findUnique"]>> = null;
let prevShipping: Awaited<ReturnType<Db["shippingSettings"]["findUnique"]>> = null;
let A: { id: number }, B: { id: number };
const PRICE = 40_000;

const customer = {
  customerName: "Prueba Integración",
  customerEmail: "integracion@example.invalid",
  customerPhone: "+54 9 11 5555 1234",
  street: "Calle Falsa 123",
  postalCode: "1000",
  city: "CABA",
  province: "Buenos Aires",
  paymentMethod: "Transfer",
};

async function order(items: { productId: number; quantity: number; size?: string }[], couponCode?: string) {
  const req = new Request("http://localhost/api/orders", {
    method: "POST",
    headers: { "content-type": "application/json", "x-forwarded-for": "203.0.113.7" },
    body: JSON.stringify({ ...customer, items: items.map((i) => ({ size: "M", ...i })), couponCode }),
  });
  const res = await POST(req);
  const json = (await res.json()) as Record<string, unknown>;
  if (typeof json.orderId === "string") created.orderIds.push(json.orderId);
  return { status: res.status, json };
}
const line = (p: { id: number }, quantity: number) => ({ productId: p.id, quantity });
const getOrder = (publicId: unknown) => prisma.order.findUniqueOrThrow({ where: { publicId: String(publicId) }, include: { items: true } });
const stockOf = async (p: { id: number }) => (await prisma.productSize.findUniqueOrThrow({ where: { productId_size: { productId: p.id, size: "M" } } })).stock;

run("pedidos (integración con base de datos)", () => {
  beforeAll(async () => {
    process.env.DATABASE_URL = url;
    process.env.DIRECT_URL = url;
    ({ prisma } = await import("@/lib/prisma"));
    ({ POST } = await import("@/app/api/orders/route"));

    prevBundle = await prisma.bundleSettings.findUnique({ where: { id: 1 } });
    prevShipping = await prisma.shippingSettings.findUnique({ where: { id: 1 } });
    await prisma.shippingSettings.upsert({ where: { id: 1 }, create: { id: 1, flatCost: 3_000, freeShippingThreshold: null }, update: { flatCost: 3_000, freeShippingThreshold: null } });

    const mk = async (n: number) => {
      const p = await prisma.product.create({
        data: {
          slug: `${TAG}-${n}`, team: `26-27 ${TAG} ${n} Home Fans Soccer Jersey`, type: "fan", price: PRICE,
          colorCss: "#000", images: [], description: "", stock: 100, sizes: ["S", "M", "L"],
        },
      });
      await prisma.productSize.create({ data: { productId: p.id, size: "M", stock: 100 } });
      created.productIds.push(p.id);
      return p;
    };
    A = await mk(1);
    B = await mk(2);
    for (const [code, value] of [["IT10", 10], ["IT15", 15], ["IT30", 30]] as const) {
      const c = await prisma.coupon.create({ data: { code: `${code}${TAG.slice(-6).toUpperCase()}`, type: "percentage", value, active: true } });
      created.couponIds.push(c.id);
    }
  });

  afterAll(async () => {
    if (!prisma) return;
    const orders = await prisma.order.findMany({ where: { publicId: { in: created.orderIds } }, select: { id: true } });
    await prisma.orderItem.deleteMany({ where: { orderId: { in: orders.map((o) => o.id) } } });
    await prisma.order.deleteMany({ where: { id: { in: orders.map((o) => o.id) } } });
    await prisma.product.deleteMany({ where: { id: { in: created.productIds } } }); // los talles se borran en cascada
    await prisma.coupon.deleteMany({ where: { id: { in: created.couponIds } } });
    await prisma.bundleSettings.deleteMany({});
    if (prevBundle) await prisma.bundleSettings.create({ data: prevBundle });
    await prisma.shippingSettings.deleteMany({});
    if (prevShipping) await prisma.shippingSettings.create({ data: prevShipping });
    await prisma.$disconnect();
  });

  const setBundle = (data: { enabled: boolean; minQty?: number; percent?: number; minQty2?: number | null; percent2?: number | null }) =>
    prisma.bundleSettings.upsert({
      where: { id: 1 },
      create: { id: 1, minQty: 2, percent: 10, minQty2: null, percent2: null, ...data },
      update: { minQty2: null, percent2: null, ...data },
    });
  const code = (prefix: string) => `${prefix}${TAG.slice(-6).toUpperCase()}`;

  it("un pedido simple: precio de la base, envío fijo y stock descontado", async () => {
    await setBundle({ enabled: false });
    const before = await stockOf(A);
    const { status, json } = await order([line(A, 1)]);
    expect(status).toBeLessThan(300);
    const o = await getOrder(json.orderId);
    expect(o.items[0].unitPrice).toBe(PRICE);
    expect(o.discountAmount).toBe(0);
    expect(o.shippingCost).toBe(3_000);
    expect(o.total).toBe(PRICE + 3_000);
    expect(await stockOf(A)).toBe(before - 1);
  });

  it("combo apagado: no descuenta aunque haya muchas unidades", async () => {
    await setBundle({ enabled: false });
    const { json } = await order([line(A, 3), line(B, 2)]);
    const o = await getOrder(json.orderId);
    expect(o.discountAmount).toBe(0);
    expect(o.bundleApplied).toBe(false);
  });

  it("combo de un escalón", async () => {
    await setBundle({ enabled: true, minQty: 2, percent: 10 });
    let o = await getOrder((await order([line(A, 1)])).json.orderId);
    expect(o.discountAmount).toBe(0);
    o = await getOrder((await order([line(A, 1), line(B, 1)])).json.orderId);
    expect(o.bundleApplied).toBe(true);
    expect(o.discountAmount).toBe(8_000);
    expect(o.total).toBe(2 * PRICE - 8_000 + 3_000);
  });

  it("dos escalones: 2 unidades al 10% y 4 al 20%", async () => {
    await setBundle({ enabled: true, minQty: 2, percent: 10, minQty2: 4, percent2: 20 });
    let o = await getOrder((await order([line(A, 3)])).json.orderId);
    expect(o.discountAmount).toBe(12_000);
    o = await getOrder((await order([line(A, 2), line(B, 2)])).json.orderId);
    expect(o.bundleApplied).toBe(true);
    expect(o.discountAmount).toBe(32_000);
    expect(o.total).toBe(4 * PRICE - 32_000 + 3_000);
  });

  it("combo vs cupón: rige el que más descuenta y solo se gasta el cupón que gana", async () => {
    await setBundle({ enabled: true, minQty: 2, percent: 15 });
    const usedOf = async (prefix: string) => (await prisma.coupon.findUniqueOrThrow({ where: { code: code(prefix) } })).usedCount;

    // cupón 10% < combo 15% → combo, el cupón no se gasta
    let o = await getOrder((await order([line(A, 1), line(B, 1)], code("IT10"))).json.orderId);
    expect(o.bundleApplied).toBe(true);
    expect(o.couponCode).toBeNull();
    expect(await usedOf("IT10")).toBe(0);

    // empate 15% = 15% → combo
    o = await getOrder((await order([line(A, 1), line(B, 1)], code("IT15"))).json.orderId);
    expect(o.bundleApplied).toBe(true);
    expect(o.couponCode).toBeNull();
    expect(await usedOf("IT15")).toBe(0);

    // cupón 30% > combo → cupón, se gasta una vez
    o = await getOrder((await order([line(A, 1), line(B, 1)], code("IT30"))).json.orderId);
    expect(o.bundleApplied).toBe(false);
    expect(o.couponCode).toBe(code("IT30"));
    expect(o.discountAmount).toBe(24_000);
    expect(await usedOf("IT30")).toBe(1);

    // una sola unidad + cupón: aplica el cupón
    o = await getOrder((await order([line(A, 1)], code("IT10"))).json.orderId);
    expect(o.couponCode).toBe(code("IT10"));
    expect(o.discountAmount).toBe(4_000);
  });

  it("cupón inexistente: se rechaza y el stock queda como estaba (la transacción se deshace)", async () => {
    const before = await stockOf(A);
    const { status, json } = await order([line(A, 2)], "NOEXISTE");
    expect(status).toBe(400);
    expect(json.error).toBeTruthy();
    expect(await stockOf(A)).toBe(before);
  });

  it("sin stock suficiente: 400 y nada se descuenta", async () => {
    const before = await stockOf(B);
    const { status } = await order([line(B, 100_000)]);
    expect(status).toBe(400);
    expect(await stockOf(B)).toBe(before);
  });

  it("pedido con dos líneas donde la segunda falla: la primera tampoco descuenta stock", async () => {
    const before = await stockOf(A);
    const { status } = await order([line(A, 1), line(B, 100_000)]);
    expect(status).toBe(400);
    expect(await stockOf(A)).toBe(before);
  });

  it("producto inexistente o talle inválido: 400", async () => {
    expect((await order([{ productId: 999_999_999, quantity: 1 }])).status).toBe(400);
    expect((await order([{ productId: A.id, quantity: 1, size: "XXXL" }])).status).toBe(400);
    expect((await order([{ productId: A.id, quantity: 0 }])).status).toBe(400);
    expect((await order([{ productId: A.id, quantity: -2 }])).status).toBe(400);
  });

  it("datos de contacto obligatorios", async () => {
    const res = await POST(
      new Request("http://localhost/api/orders", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ items: [{ productId: A.id, quantity: 1, size: "M" }] }),
      }),
    );
    expect(res.status).toBe(400);
    expect(((await res.json()) as { errors: Record<string, unknown> }).errors.customerName).toBeTruthy();
  });

  it("envío gratis desde el monto configurado", async () => {
    await setBundle({ enabled: false });
    await prisma.shippingSettings.update({ where: { id: 1 }, data: { freeShippingThreshold: 70_000 } });
    try {
      let o = await getOrder((await order([line(A, 1)])).json.orderId);
      expect(o.shippingCost).toBe(3_000);
      o = await getOrder((await order([line(A, 2)])).json.orderId);
      expect(o.shippingCost).toBe(0);
      expect(o.total).toBe(2 * PRICE);
    } finally {
      await prisma.shippingSettings.update({ where: { id: 1 }, data: { freeShippingThreshold: null } });
    }
  });
});
