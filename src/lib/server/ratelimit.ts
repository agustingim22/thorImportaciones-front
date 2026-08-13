import "server-only";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { NextResponse } from "next/server";

const redis =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      })
    : null;

const limiters = new Map<string, Ratelimit>();

function getLimiter(action: string, limit: number, windowSeconds: number): Ratelimit | null {
  if (!redis) return null;
  const cacheKey = `${action}:${limit}:${windowSeconds}`;
  let rl = limiters.get(cacheKey);
  if (!rl) {
    rl = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(limit, `${windowSeconds} s`),
      prefix: "thor-ratelimit",
    });
    limiters.set(cacheKey, rl);
  }
  return rl;
}

function clientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}

/**
 * Limita cuántas veces la misma IP puede pegarle a una acción sensible
 * (login, registro, crear pedido) en una ventana de tiempo. Si Upstash no
 * está configurado (falta UPSTASH_REDIS_REST_URL/TOKEN), no bloquea nada
 * — falla abierto, igual que el envío de emails.
 */
export async function rateLimit(
  action: string,
  req: Request,
  limit: number,
  windowSeconds: number,
): Promise<NextResponse | null> {
  const limiter = getLimiter(action, limit, windowSeconds);
  if (!limiter) return null;

  const { success, reset } = await limiter.limit(`${action}:${clientIp(req)}`);
  if (success) return null;

  const retryAfter = Math.max(1, Math.ceil((reset - Date.now()) / 1000));
  return NextResponse.json(
    { error: "Demasiados intentos. Esperá un momento y volvé a intentar." },
    { status: 429, headers: { "Retry-After": String(retryAfter) } },
  );
}
