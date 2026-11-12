/**
 * Orden "Destacados" del catálogo (el que se ve por defecto).
 *
 * Sin esto el catálogo se ordena por fecha de carga, y el último lote que se importa (por ejemplo
 * shorts) se queda con todas las primeras páginas. El ranking decide el orden con tres criterios, de
 * mayor a menor peso:
 *
 *  1. GRUPO — qué tipo de producto es:
 *       0 camisetas de fútbol (fan, jugador, retro) de un equipo destacado
 *       1 otras camisetas de fútbol
 *       2 shorts, remeras, conjuntos
 *       3 NBA y rugby
 *  2. TIER — camisetas "de juego" (Local, Visitante, Alternativa, Cuarta) antes que las de
 *     entrenamiento, arquero, edición especial o manga larga.
 *  3. SECUENCIA — dentro de cada (grupo, tier, equipo) los productos van numerados 0, 1, 2… (temporada
 *     más nueva primero y, dentro de ella, Local → Visitante → Alternativa). Como la secuencia pesa más
 *     que el equipo, se ve primero la mejor camiseta de CADA equipo, después la segunda de cada uno, y así:
 *     la primera página muestra muchos equipos distintos en vez de seis camisetas seguidas del mismo.
 *     Entre equipos con la misma secuencia manda `prio` (Boca, River, Argentina… primero).
 *
 * Todo se compone en un solo entero, `Product.rank` (menor = primero), para ordenar con un índice:
 *
 *     rank = grupo × 10.000.000 + tier × 1.000.000 + secuencia × 100 + prio
 *
 * La secuencia depende de los demás productos del equipo, así que se calcula para todos juntos en
 * `classifyClubs` (corre al aplicar la clasificación desde el panel y todos los días). Al crear o editar
 * un producto se le pone una secuencia provisoria (0: el primero de su grupo, que suele ser lo que
 * corresponde a algo recién cargado) hasta la próxima clasificación.
 */
import { FEATURED_CLUBS, HOME_TEAM_SLUGS } from "./clubs";

export const GROUP_SIZE = 10_000_000;
const TIER_SIZE = 1_000_000;
const SEQ_SIZE = 100;
const MAX_SEQ = 9_999;

const JERSEY_TYPES = ["fan", "player", "retro"];

/** 0 camisetas de equipo destacado · 1 otras camisetas · 2 shorts/remeras/conjuntos · 3 NBA/rugby. */
export function productGroup(type: string, club: string | null | undefined): number {
  if (type === "nba" || type === "rugby") return 3;
  if (JERSEY_TYPES.includes(type)) return club ? 0 : 1;
  return 2;
}

/** Grupo (0-3) de un valor de `Product.rank`. */
export const rankGroup = (rank: number): number => Math.floor(rank / GROUP_SIZE);

// Orden de los equipos cuando empatan en secuencia: los de la portada, el resto del menú, y los secundarios.
const TEAM_ORDER: string[] = [
  ...HOME_TEAM_SLUGS,
  ...FEATURED_CLUBS.filter((c) => !c.more && !HOME_TEAM_SLUGS.includes(c.slug)).map((c) => c.slug),
  ...FEATURED_CLUBS.filter((c) => c.more).map((c) => c.slug),
];

function teamPriority(club: string | null | undefined): number {
  const i = club ? TEAM_ORDER.indexOf(club) : -1;
  return i === -1 ? 99 : Math.min(i, 98);
}

/** Palabras que marcan una camiseta que no es la de juego estándar. */
const SECONDARY_KIT = /\b(training|goalkeeper|special|limited|commemorative|casual|joint|anniversary|halloween|oktoberfest)\b|long sleeve/i;
const KIT_ORDER: [RegExp, number][] = [
  [/\bhome\b/i, 0],
  [/\baway\b/i, 1],
  [/\bthird\b/i, 2],
  [/\bfourth\b/i, 3],
];

/** Año con el que empieza la temporada del nombre ("26-27" → 2026, "1998-1999" → 1998); 0 si no tiene. */
function seasonStart(team: string): number {
  const m = team.trim().match(/^(\d{4}|\d{2})(?=[-\s])/);
  if (!m) return 0;
  const n = Number(m[1]);
  return m[1].length === 4 ? n : n > 40 ? 1900 + n : 2000 + n;
}

export type RankMeta = {
  group: number;
  tier: number; // 0 camiseta de juego (Local/Visitante/Alternativa/Cuarta) · 1 el resto
  prio: number; // desempate entre equipos
  season: number; // año de la temporada, para ordenar dentro del equipo
  kit: number; // 0 Local · 1 Visitante · 2 Alternativa · 3 Cuarta · 4 sin dato
};

export function rankMeta(team: string, type: string, club: string | null | undefined): RankMeta {
  const kit = KIT_ORDER.find(([re]) => re.test(team))?.[1] ?? 4;
  return {
    group: productGroup(type, club),
    tier: kit < 4 && !SECONDARY_KIT.test(team) ? 0 : 1,
    prio: teamPriority(club),
    season: seasonStart(team),
    kit,
  };
}

export function composeRank(meta: Pick<RankMeta, "group" | "tier" | "prio">, seq: number): number {
  return meta.group * GROUP_SIZE + meta.tier * TIER_SIZE + Math.min(Math.max(seq, 0), MAX_SEQ) * SEQ_SIZE + meta.prio;
}

/** Rank provisorio de un producto recién creado o editado (secuencia 0). */
export function productRank(team: string, type: string, club: string | null | undefined): number {
  return composeRank(rankMeta(team, type, club), 0);
}

/** Orden de dos productos del mismo (grupo, tier, equipo): temporada más nueva, Local antes que
 *  Visitante antes que Alternativa, y después el más nuevo cargado. */
export function compareWithinTeam(
  a: { meta: RankMeta; createdAt: Date; id: number },
  b: { meta: RankMeta; createdAt: Date; id: number },
): number {
  return (
    b.meta.season - a.meta.season ||
    a.meta.kit - b.meta.kit ||
    b.createdAt.getTime() - a.createdAt.getTime() ||
    b.id - a.id
  );
}
