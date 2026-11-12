/**
 * Equipos destacados para el menú y el filtro del catálogo: clubes y selecciones.
 * Seguro para cliente y servidor (sin dependencias de servidor).
 *
 * (Por herencia el código, la columna `Product.club` y la URL `?club=` dicen "club",
 * pero acá entran también las selecciones nacionales; `group` las distingue.)
 *
 * El proveedor nombra los equipos con siglas ("RMA", "ACM", "BAR"…) y a veces con
 * el nombre completo, así que cada equipo tiene una lista de alias. `detectClub`
 * compara por PALABRA COMPLETA, no por texto contenido, para evitar falsos
 * positivos: "INT" no debe matchear "Internacional" ni "Inter Miami", y "ROMA" no
 * a "Romania". `excludes` vetan el match cuando el texto contiene esa frase
 * (ej. "MILAN" no debe tomar "Inter Milan", "ENGLAND" no a "New England").
 *
 * Los equipos con `more: true` son secundarios: tienen su página y se pueden
 * buscar, pero no aparecen en el menú ni en los chips del catálogo (solo en /equipos).
 *
 * Para sumar un equipo: agregarlo acá y correr la clasificación (pestaña "Equipos"
 * del admin) para que tome los productos existentes. El orden de la lista es el
 * orden del menú dentro de cada grupo.
 */
export type ClubGroup = "club" | "selection";

export type FeaturedClub = {
  slug: string;
  name: string;
  group: ClubGroup;
  /** Siglas o nombres con los que aparece el equipo en el título del producto. */
  aliases: string[];
  /** Si el texto contiene alguna de estas frases, el equipo NO matchea. */
  excludes?: string[];
  /** Cómo se nombra en títulos de página ("Camisetas de …"). Por defecto: el nombre,
   *  o "la Selección de {nombre}" para las selecciones. */
  heading?: string;
  /** Equipo secundario: fuera del menú y de los chips; visible en /equipos. */
  more?: boolean;
};

export const CLUB_GROUPS: { key: ClubGroup; label: string }[] = [
  { key: "club", label: "Clubes" },
  { key: "selection", label: "Selecciones" },
];

/** Tipos de producto que NO se clasifican por equipo: el NBA y el rugby comparten nombres
 *  con equipos de fútbol ("SA Spurs" ≠ Tottenham, "England Rugby" ≠ selección de fútbol). */
export const NO_CLUB_TYPES: readonly string[] = ["nba", "rugby"];

export const FEATURED_CLUBS: FeaturedClub[] = [
  // ---- Clubes (menú) ----
  { slug: "boca-juniors", name: "Boca Juniors", group: "club", aliases: ["BOCA JUNIORS", "BOCA"] },
  { slug: "river-plate", name: "River Plate", group: "club", aliases: ["RIVER PLATE", "RIVER"] },
  { slug: "real-madrid", name: "Real Madrid", group: "club", aliases: ["RMA", "REAL MADRID"] },
  {
    slug: "barcelona",
    name: "Barcelona",
    group: "club",
    aliases: ["BAR", "BARCA", "BARCELONA", "FC BARCELONA"],
    excludes: ["BARCELONA SC"], // Barcelona de Guayaquil (Ecuador)
  },
  {
    slug: "manchester-united",
    name: "Manchester United",
    group: "club",
    aliases: ["MAN UTD", "MAN UNITED", "MANCHESTER UNITED"],
  },
  { slug: "manchester-city", name: "Manchester City", group: "club", aliases: ["MAN CITY", "MANCHESTER CITY"] },
  { slug: "liverpool", name: "Liverpool", group: "club", aliases: ["LIV", "LIVERPOOL"] },
  { slug: "arsenal", name: "Arsenal", group: "club", aliases: ["ARS", "ARSENAL"] },
  { slug: "chelsea", name: "Chelsea", group: "club", aliases: ["CHE", "CHELSEA"] },
  {
    slug: "tottenham",
    name: "Tottenham",
    group: "club",
    aliases: ["TOT", "TOTTENHAM", "TOTTENHAM HOTSPUR", "SPURS"],
  },
  { slug: "juventus", name: "Juventus", group: "club", aliases: ["JUV", "JUVE", "JUVENTUS"] },
  {
    slug: "ac-milan",
    name: "AC Milan",
    group: "club",
    aliases: ["ACM", "AC MILAN", "MILAN"],
    excludes: ["INTER MILAN", "INTER DE MILAN"],
  },
  {
    slug: "inter",
    name: "Inter de Milán",
    group: "club",
    aliases: ["INT", "INTER MILAN", "INTER DE MILAN", "INTERNAZIONALE"],
  },
  {
    slug: "bayern-munich",
    name: "Bayern Múnich",
    group: "club",
    aliases: ["BAYERN", "BAYERN MUNICH", "BAYERN MUNCHEN"],
  },
  { slug: "psg", name: "PSG", group: "club", aliases: ["PSG", "PARIS SAINT GERMAIN", "PARIS SG"] },

  // ---- Clubes secundarios (solo /equipos y búsqueda) ----
  {
    slug: "atletico-madrid",
    name: "Atlético de Madrid",
    group: "club",
    aliases: ["ATM", "ATLETICO MADRID", "ATLETICO DE MADRID", "ATLETI"],
    more: true,
  },
  { slug: "napoli", name: "Napoli", group: "club", aliases: ["NAPOLI"], more: true },
  { slug: "dortmund", name: "Borussia Dortmund", group: "club", aliases: ["DORTMUND", "BORUSSIA DORTMUND", "BVB"], more: true },
  { slug: "benfica", name: "Benfica", group: "club", aliases: ["BENFICA"], more: true },
  { slug: "palmeiras", name: "Palmeiras", group: "club", aliases: ["PALMEIRAS"], more: true },
  { slug: "flamengo", name: "Flamengo", group: "club", aliases: ["FLAMENGO"], more: true },
  { slug: "corinthians", name: "Corinthians", group: "club", aliases: ["CORINTHIANS"], more: true },
  { slug: "club-america", name: "Club América", group: "club", aliases: ["CLUB AMERICA"], more: true },
  { slug: "chivas", name: "Chivas", group: "club", aliases: ["CHIVAS", "CHIVAS GUADALAJARA"], more: true },
  { slug: "tigres", name: "Tigres UANL", group: "club", aliases: ["TIGRES UANL", "TIGRES"], more: true },
  { slug: "monterrey", name: "Monterrey", group: "club", aliases: ["MONTERREY", "CF MONTERREY"], more: true },
  { slug: "racing-club", name: "Racing Club", group: "club", aliases: ["RACING CLUB"], more: true },
  {
    slug: "independiente",
    name: "Independiente",
    group: "club",
    aliases: ["INDEPENDIENTE", "CLUB ATLETICO INDEPENDIENTE"],
    // Otros clubes que llevan "Independiente" en el nombre
    excludes: ["INDEPENDIENTE DEL VALLE", "INDEPENDIENTE MEDELLIN", "INDEPENDIENTE SANTA FE", "INDEPENDIENTE RIVADAVIA"],
    more: true,
  },
  { slug: "san-lorenzo", name: "San Lorenzo", group: "club", aliases: ["SAN LORENZO"], more: true },
  { slug: "velez", name: "Vélez Sarsfield", group: "club", aliases: ["VELEZ SARSFIELD", "VELEZ"], more: true },
  { slug: "rosario-central", name: "Rosario Central", group: "club", aliases: ["ROSARIO CENTRAL"], more: true },

  // ---- Selecciones ----
  {
    slug: "argentina",
    name: "Argentina",
    group: "selection",
    aliases: ["ARGENTINA"],
    heading: "la Selección Argentina",
  },
  { slug: "brasil", name: "Brasil", group: "selection", aliases: ["BRAZIL", "BRASIL"] },
  { slug: "portugal", name: "Portugal", group: "selection", aliases: ["PORTUGAL"] },
  { slug: "japon", name: "Japón", group: "selection", aliases: ["JAPAN", "JAPON"] },
  { slug: "espana", name: "España", group: "selection", aliases: ["SPAIN", "ESPANA"] },
  { slug: "francia", name: "Francia", group: "selection", aliases: ["FRANCE", "FRANCIA"] },
  { slug: "alemania", name: "Alemania", group: "selection", aliases: ["GERMANY", "ALEMANIA"] },
  {
    slug: "inglaterra",
    name: "Inglaterra",
    group: "selection",
    aliases: ["ENGLAND", "INGLATERRA"],
    excludes: ["NEW ENGLAND"], // New England Revolution (MLS)
  },
  { slug: "italia", name: "Italia", group: "selection", aliases: ["ITALY", "ITALIA"] },
  {
    slug: "mexico",
    name: "México",
    group: "selection",
    aliases: ["MEXICO"],
    excludes: ["NEW MEXICO"], // New Mexico United (USL)
  },
  { slug: "uruguay", name: "Uruguay", group: "selection", aliases: ["URUGUAY"] },
  { slug: "colombia", name: "Colombia", group: "selection", aliases: ["COLOMBIA"] },
  {
    slug: "paises-bajos",
    name: "Países Bajos",
    group: "selection",
    aliases: ["NETHERLANDS", "HOLLAND", "PAISES BAJOS", "HOLANDA"],
    heading: "la Selección de Países Bajos (Holanda)", // así la buscan acá
  },
  {
    slug: "estados-unidos",
    name: "Estados Unidos",
    group: "selection",
    aliases: ["USA", "UNITED STATES", "ESTADOS UNIDOS", "EEUU", "USMNT"],
  },
];

/** Los equipos que van en el menú y en los chips del catálogo (sin los secundarios). */
export const MENU_CLUBS: FeaturedClub[] = FEATURED_CLUBS.filter((c) => !c.more);

/** Equipos de la portada ("Comprá por equipo"), en este orden. */
export const HOME_TEAM_SLUGS: string[] = [
  "boca-juniors",
  "river-plate",
  "argentina",
  "real-madrid",
  "barcelona",
  "brasil",
  "manchester-united",
  "liverpool",
  "psg",
  "portugal",
  "juventus",
  "ac-milan",
];

/** Minúsculas/tildes/símbolos fuera: "Inter de Milán (无星)" → "INTER DE MILAN". */
export function normalizeText(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, " ")
    .trim();
}

// Los alias se normalizan una sola vez y se rodean de espacios para comparar palabras completas.
const COMPILED = FEATURED_CLUBS.map((club) => ({
  club,
  aliases: club.aliases.map((a) => ` ${normalizeText(a)} `),
  excludes: (club.excludes ?? []).map((a) => ` ${normalizeText(a)} `),
}));

/** Devuelve el equipo destacado al que pertenece un producto según su nombre, o null. */
export function detectClub(team: string | null | undefined): FeaturedClub | null {
  if (!team) return null;
  const text = ` ${normalizeText(team)} `;
  for (const { club, aliases, excludes } of COMPILED) {
    if (excludes.some((e) => text.includes(e))) continue;
    if (aliases.some((a) => text.includes(a))) return club;
  }
  return null;
}

/** Como `detectClub`, pero respeta que el NBA y el rugby nunca se clasifican por equipo. */
export function detectClubForProduct(team: string | null | undefined, type: string | null | undefined): FeaturedClub | null {
  if (type && NO_CLUB_TYPES.includes(type)) return null;
  return detectClub(team);
}

/** Dirección de la página de un equipo: /equipo/real-madrid (next.config.ts la reescribe a /catalogo?club=…). */
export const clubPath = (slug: string): string => `/equipo/${slug}`;

export function getClubBySlug(slug: string | null | undefined): FeaturedClub | null {
  return FEATURED_CLUBS.find((c) => c.slug === slug) ?? null;
}

/** El equipo tal como se lee después de "Camisetas de …": "River Plate", "la Selección Argentina". */
export function clubHeading(club: FeaturedClub): string {
  return club.heading ?? (club.group === "selection" ? `la Selección de ${club.name}` : club.name);
}

// Términos por los que un cliente puede buscar cada equipo: nombre, siglas y slug.
const SEARCH_INDEX = FEATURED_CLUBS.map((club) => ({
  club,
  terms: [club.name, club.slug.replace(/-/g, " "), ...club.aliases].map(normalizeText),
}));

/** Equipos a los que apunta una búsqueda de texto ("real madrid", "rma", "barca", "brasil",
 *  "manchester", "camiseta del real madrid 2025"). Sirve para que la búsqueda encuentre los
 *  productos del equipo aunque el título del proveedor use otra sigla u otro idioma. */
export function matchClubsForSearch(query: string): FeaturedClub[] {
  const nq = normalizeText(query);
  if (nq.length < 2) return [];
  const found = new Map<string, FeaturedClub>();
  for (const { club, terms } of SEARCH_INDEX) {
    // igual al nombre/sigla, o (con 4+ letras) empieza igual: "manch", "real mad", "liverp"
    if (terms.some((t) => t === nq || (nq.length >= 4 && t.startsWith(nq)))) found.set(club.slug, club);
  }
  // o la búsqueda contiene el equipo como palabra: "camiseta del real madrid"
  const inside = detectClub(query);
  if (inside) found.set(inside.slug, inside);
  return [...found.values()];
}
