import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { rateLimit } from "@/lib/server/ratelimit";

/**
 * Recibe los avisos de la política de seguridad en modo "solo reportar" (Content-Security-Policy-Report-Only):
 * el navegador dice qué habría bloqueado si la política estuviera activa, pero no bloquea nada. Sirve para
 * ajustar la lista de servicios permitidos (Google Tag Manager, Meta Pixel, Instagram…) con datos reales antes de
 * pensar en hacerla obligatoria. Se anota en el log y en Sentry, agrupado por tipo de bloqueo y destino.
 */
const seen = new Set<string>();

/** Avisos que genera el propio navegador de quien visita (extensiones, etc.) y no dicen nada del sitio. */
const NOISE = /^(chrome-extension|moz-extension|safari-extension|safari-web-extension|webkit-masked-url|about|ms-browser-extension)/i;

function hostOf(uri: string): string {
  try {
    return new URL(uri).host || uri;
  } catch {
    return uri; // "inline", "eval", "data", etc.
  }
}

export async function POST(req: Request) {
  const limited = await rateLimit("csp-report", req, 60, 60);
  if (limited) return limited;

  let raw = "";
  try {
    raw = (await req.text()).slice(0, 8_000);
  } catch {
    return new NextResponse(null, { status: 204 });
  }

  let r: Record<string, unknown> = {};
  try {
    const parsed = JSON.parse(raw);
    // Formato clásico ({"csp-report": {...}}) o el nuevo de Reporting API ([{ body: {...} }]).
    const body = Array.isArray(parsed) ? parsed[0]?.body : (parsed["csp-report"] ?? parsed);
    r = (body ?? {}) as Record<string, unknown>;
  } catch {
    return new NextResponse(null, { status: 204 });
  }

  const str = (k1: string, k2: string) => String(r[k1] ?? r[k2] ?? "");
  const directive = str("effective-directive", "effectiveDirective") || str("violated-directive", "violatedDirective");
  const blocked = str("blocked-uri", "blockedURL");
  const sourceFile = str("source-file", "sourceFile");
  if (!directive || NOISE.test(blocked) || NOISE.test(sourceFile)) return new NextResponse(null, { status: 204 });

  const page = (() => {
    try {
      const u = new URL(str("document-uri", "documentURL"));
      return u.pathname; // sin query: puede traer datos personales
    } catch {
      return "";
    }
  })();

  const key = `${directive}|${hostOf(blocked)}`;
  if (!seen.has(key)) {
    if (seen.size > 300) seen.clear();
    seen.add(key);
    console.warn("[csp]", JSON.stringify({ directive, blocked: hostOf(blocked), page, sourceFile: hostOf(sourceFile) }));
    Sentry.captureMessage(`CSP (solo reporte): ${directive} → ${hostOf(blocked)}`, {
      level: "warning",
      fingerprint: ["csp-report", directive, hostOf(blocked)],
      extra: { page, sourceFile: hostOf(sourceFile) },
    });
  }
  return new NextResponse(null, { status: 204 });
}
