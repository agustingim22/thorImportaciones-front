import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const limit = vi.fn<(key: string) => Promise<{ success: boolean; reset: number }>>();
const captureException = vi.fn();

vi.mock("@upstash/ratelimit", () => {
  class Ratelimit {
    static slidingWindow() {
      return {};
    }
    limit(key: string) {
      return limit(key);
    }
  }
  return { Ratelimit };
});
vi.mock("@upstash/redis", () => ({ Redis: class {} }));
vi.mock("@sentry/nextjs", () => ({ captureException: (...a: unknown[]) => captureException(...a) }));

const req = () => new Request("https://www.ejemplo.test/api/orders", { method: "POST", headers: { "x-forwarded-for": "203.0.113.9, 10.0.0.1" } });

async function load(withUpstash: boolean) {
  vi.resetModules();
  if (withUpstash) {
    process.env.UPSTASH_REDIS_REST_URL = "https://ejemplo.upstash.io";
    process.env.UPSTASH_REDIS_REST_TOKEN = "token-de-prueba";
  } else {
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
  }
  return (await import("@/lib/server/ratelimit")).rateLimit;
}

beforeEach(() => {
  limit.mockReset();
  captureException.mockReset();
  vi.spyOn(console, "error").mockImplementation(() => {});
});
afterEach(() => {
  vi.restoreAllMocks();
  delete process.env.UPSTASH_REDIS_REST_URL;
  delete process.env.UPSTASH_REDIS_REST_TOKEN;
});

describe("límite de intentos por IP", () => {
  it("sin Upstash configurado no bloquea nada", async () => {
    const rateLimit = await load(false);
    expect(await rateLimit("orders", req(), 10, 600)).toBeNull();
    expect(limit).not.toHaveBeenCalled();
  });

  it("dentro del límite deja pasar, usando la primera IP del encabezado", async () => {
    const rateLimit = await load(true);
    limit.mockResolvedValue({ success: true, reset: Date.now() + 1000 });
    expect(await rateLimit("orders", req(), 10, 600)).toBeNull();
    expect(limit).toHaveBeenCalledWith("orders:203.0.113.9");
  });

  it("pasado el límite responde 429 con Retry-After", async () => {
    const rateLimit = await load(true);
    limit.mockResolvedValue({ success: false, reset: Date.now() + 30_000 });
    const res = await rateLimit("admin-login", req(), 8, 900);
    expect(res?.status).toBe(429);
    expect(Number(res?.headers.get("Retry-After"))).toBeGreaterThanOrEqual(29);
    expect(((await res?.json()) as { error: string }).error).toMatch(/Demasiados intentos/);
  });

  it("si Upstash falla (base borrada, sin red, credenciales vencidas) deja pasar en vez de dar error", async () => {
    const rateLimit = await load(true);
    limit.mockRejectedValue(new Error("getaddrinfo ENOTFOUND ejemplo.upstash.io", { cause: new Error("ENOTFOUND") }));
    await expect(rateLimit("orders", req(), 10, 600)).resolves.toBeNull();
    expect(captureException).toHaveBeenCalledTimes(1);
  });

  it("si Upstash no contesta a tiempo la librería no lanza error: devuelve success con razón timeout, y también se deja pasar y se avisa", async () => {
    const rateLimit = await load(true);
    limit.mockResolvedValue({ success: true, reason: "timeout", reset: 0 } as never);
    await expect(rateLimit("orders", req(), 10, 600)).resolves.toBeNull();
    expect(captureException).toHaveBeenCalledTimes(1);
    expect(console.error).toHaveBeenCalledTimes(1);
  });

  it("tras un fallo no se vuelve a consultar durante un minuto (un Upstash caído no demora cada pedido) y después reintenta", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    try {
      vi.setSystemTime(new Date("2026-11-13T12:00:00Z"));
      const rateLimit = await load(true);
      limit.mockRejectedValue(new Error("caído"));
      for (let i = 0; i < 5; i++) await rateLimit("orders", req(), 10, 600);
      expect(limit).toHaveBeenCalledTimes(1); // solo la primera consulta; las otras 4 ni lo intentan
      expect(captureException).toHaveBeenCalledTimes(1); // y se avisa una sola vez

      vi.setSystemTime(new Date("2026-11-13T12:00:59Z"));
      await rateLimit("orders", req(), 10, 600);
      expect(limit).toHaveBeenCalledTimes(1); // todavía en pausa

      vi.setSystemTime(new Date("2026-11-13T12:01:01Z"));
      limit.mockResolvedValue({ success: true, reset: 0 });
      await rateLimit("orders", req(), 10, 600);
      expect(limit).toHaveBeenCalledTimes(2); // pasó el minuto: vuelve a consultar
    } finally {
      vi.useRealTimers();
    }
  });

  it("mientras Upstash está en pausa no se frenan los pedidos (aunque el límite estuviera vencido)", async () => {
    const rateLimit = await load(true);
    limit.mockRejectedValueOnce(new Error("caído"));
    await rateLimit("orders", req(), 10, 600);
    limit.mockResolvedValue({ success: false, reset: Date.now() + 5000 });
    await expect(rateLimit("orders", req(), 10, 600)).resolves.toBeNull();
  });
});
