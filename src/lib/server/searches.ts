import "server-only";
import { prisma } from "@/lib/prisma";

/** Minúsculas, sin tildes y sin espacios de más: "España  " y "espana" cuentan como la misma búsqueda. */
export function normalizeSearch(q: string): string {
  return q
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

const BOT_UA = /bot|crawl|spider|slurp|headless|lighthouse|facebookexternalhit|preview|monitor|uptime/i;
export const isBotUserAgent = (ua: string | null | undefined): boolean => BOT_UA.test(ua ?? "");

/** Anota una búsqueda del catálogo: cuántas veces se buscó ese texto y cuántos resultados dio la última vez.
 *  Guarda solo el texto (sin datos de quién lo buscó). Nunca rompe la página: si falla, se ignora. */
export async function logSearch(query: string, results: number): Promise<void> {
  const term = normalizeSearch(query);
  if (term.length < 2 || term.length > 60) return;
  try {
    await prisma.searchTerm.upsert({
      where: { term },
      create: { term, searches: 1, results },
      update: { searches: { increment: 1 }, results, lastAt: new Date() },
    });
  } catch {
    /* no crítico */
  }
}

/** Borra las búsquedas que se hicieron una sola vez hace más de 60 días, para que la tabla no crezca sin fin
 *  con textos al azar. Se llama desde el proceso diario. */
export async function pruneSearchTerms(): Promise<number> {
  const cutoff = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);
  const { count } = await prisma.searchTerm.deleteMany({ where: { searches: { lte: 1 }, lastAt: { lt: cutoff } } });
  return count;
}
