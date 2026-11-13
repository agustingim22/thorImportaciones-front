import "server-only";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";

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
      // Si Upstash tarda más que esto se lo da por caído (ver rateLimit).
      timeout: UPSTASH_TIMEOUT_MS,
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

/** Cuánto esperamos a Upstash antes de darlo por caído. Normalmente responde en decenas de milisegundos. */
const UPSTASH_TIMEOUT_MS = 800;
/** Tras un fallo no se lo vuelve a consultar durante este tiempo: así un Upstash caído cuesta una demora por minuto
 *  por instancia, no una en cada pedido. */
const UPSTASH_PAUSE_MS = 60_000;
let pausedUntil = 0;

/** Marca a Upstash como caído por un rato y avisa (log y Sentry). Como solo ocurre una vez por pausa, no inunda. */
function pauseUpstash(action: string, err: unknown) {
  pausedUntil = Date.now() + UPSTASH_PAUSE_MS;
  const reason = err instanceof Error ? (err.cause instanceof Error ? err.cause.message : err.message) : String(err);
  console.error(`[ratelimit] Upstash no responde (${reason}). Se deja pasar sin límite durante ${UPSTASH_PAUSE_MS / 1000} s (acción "${action}"); revisá UPSTASH_REDIS_REST_URL/TOKEN.`);
  Sentry.captureException(err, { level: "warning", fingerprint: ["ratelimit-upstash-unavailable"], extra: { action } });
}

/**
 * Limita cuántas veces la misma IP puede pegarle a una acción sensible
 * (login, registro, crear pedido) en una ventana de tiempo.
 *
 * Falla abierto: si Upstash no está configurado (falta UPSTASH_REDIS_REST_URL/TOKEN) o no responde (base borrada,
 * credenciales vencidas, caída), no bloquea nada. Es preferible quedarse sin límite de intentos un rato que dejar
 * a los clientes sin poder comprar, registrarse o validar un cupón (antes, un Upstash caído hacía fallar con 500
 * todas las rutas que usan este límite, incluido crear pedidos).
 */
export async function rateLimit(
  action: string,
  req: Request,
  limit: number,
  windowSeconds: number,
): Promise<NextResponse | null> {
  const limiter = getLimiter(action, limit, windowSeconds);
  if (!limiter || Date.now() < pausedUntil) return null;

  let result;
  try {
    result = await limiter.limit(`${action}:${clientIp(req)}`);
  } catch (err) {
    pauseUpstash(action, err);
    return null;
  }
  // Con la opción timeout la librería no lanza error si Upstash no contesta a tiempo: devuelve success con esta razón.
  if (result.reason === "timeout") {
    pauseUpstash(action, new Error(`no contestó en ${UPSTASH_TIMEOUT_MS} ms`));
    return null;
  }
  const { success, reset } = result;
  if (success) return null;

  const retryAfter = Math.max(1, Math.ceil((reset - Date.now()) / 1000));
  return NextResponse.json(
    { error: "Demasiados intentos. Esperá un momento y volvé a intentar." },
    { status: 429, headers: { "Retry-After": String(retryAfter) } },
  );
}
