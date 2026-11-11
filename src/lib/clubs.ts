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
 * Para sumar un equipo: agregarlo acá y correr la clasificación
 * (GET/POST /api/admin/clubs/classify) para que tome los productos existentes.
 * El orden de la lista es el orden del menú dentro de cada grupo.
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
};

export const CLUB_GROUPS: { key: ClubGroup; label: string }[] = [
  { key: "club", label: "Clubes" },
  { key: "selection", label: "Selecciones" },
];

export const FEATURED_CLUBS: FeaturedClub[] = [
  // ---- Clubes ----
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
];

/** Minúsculas/tildes/símbolos fuera: "Inter de Milán (无星)" → "INTER DE MILAN". */
function normalize(text: string): string {
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
  aliases: club.aliases.map((a) => ` ${normalize(a)} `),
  excludes: (club.excludes ?? []).map((a) => ` ${normalize(a)} `),
}));

/** Devuelve el equipo destacado al que pertenece un producto según su nombre, o null. */
export function detectClub(team: string | null | undefined): FeaturedClub | null {
  if (!team) return null;
  const text = ` ${normalize(team)} `;
  for (const { club, aliases, excludes } of COMPILED) {
    if (excludes.some((e) => text.includes(e))) continue;
    if (aliases.some((a) => text.includes(a))) return club;
  }
  return null;
}

export function getClubBySlug(slug: string | null | undefined): FeaturedClub | null {
  return FEATURED_CLUBS.find((c) => c.slug === slug) ?? null;
}

/** El equipo tal como se lee después de "Camisetas de …": "River Plate", "la Selección Argentina". */
export function clubHeading(club: FeaturedClub): string {
  return club.heading ?? (club.group === "selection" ? `la Selección de ${club.name}` : club.name);
}
