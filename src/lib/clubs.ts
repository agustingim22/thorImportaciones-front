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

  // Más clubes (los que tienen 6 o más camisetas en el catálogo), de más a menos. Solo /equipos y búsqueda.
  { slug: "roma", name: "Roma", group: "club", aliases: ["ROMA", "AS ROMA"], more: true },
  { slug: "newcastle", name: "Newcastle United", group: "club", aliases: ["NEWCASTLE", "NEWCASTLE UNITED"], excludes: ["NEWCASTLE JETS"], more: true },
  { slug: "hamburg-sv", name: "Hamburg SV", group: "club", aliases: ["HAMBURG SV", "HAMBURGER SV", "HAMBURG"], more: true },
  { slug: "porto", name: "Porto", group: "club", aliases: ["PORTO", "FC PORTO"], more: true },
  { slug: "marseille", name: "Marseille", group: "club", aliases: ["MARSEILLE", "OLYMPIQUE MARSEILLE"], more: true },
  { slug: "aston-villa", name: "Aston Villa", group: "club", aliases: ["ASTON VILLA"], more: true },
  { slug: "celtic", name: "Celtic", group: "club", aliases: ["CELTIC"], more: true },
  { slug: "ajax", name: "Ajax", group: "club", aliases: ["AJAX"], more: true },
  { slug: "real-betis", name: "Real Betis", group: "club", aliases: ["REAL BETIS", "BETIS"], more: true },
  { slug: "santos", name: "Santos", group: "club", aliases: ["SANTOS FC"], more: true },
  { slug: "koln", name: "FC Köln", group: "club", aliases: ["KOLN", "KOELN", "FC KOLN"], more: true },
  { slug: "toluca", name: "Toluca", group: "club", aliases: ["TOLUCA"], more: true },
  { slug: "eintracht-frankfurt", name: "Eintracht Frankfurt", group: "club", aliases: ["EINTRACHT FRANKFURT", "EINTRACHT", "FRANKFURT"], more: true },
  { slug: "fluminense", name: "Fluminense", group: "club", aliases: ["FLUMINENSE"], more: true },
  { slug: "vasco", name: "Vasco da Gama", group: "club", aliases: ["VASCO", "VASCO DA GAMA"], more: true },
  { slug: "pumas-unam", name: "Pumas UNAM", group: "club", aliases: ["PUMAS UNAM", "PUMAS"], more: true },
  { slug: "colo-colo", name: "Colo Colo", group: "club", aliases: ["COLO COLO"], more: true },
  { slug: "sporting-cp", name: "Sporting CP", group: "club", aliases: ["SPORTING LISBON", "SPORTING CP", "SPORTING LISBOA"], more: true },
  { slug: "galatasaray", name: "Galatasaray", group: "club", aliases: ["GALATASARAY"], more: true },
  { slug: "fiorentina", name: "Fiorentina", group: "club", aliases: ["FIORENTINA"], more: true },
  { slug: "sevilla", name: "Sevilla", group: "club", aliases: ["SEVILLA", "SEVILLA FC"], more: true },
  { slug: "athletic-bilbao", name: "Athletic Bilbao", group: "club", aliases: ["ATHLETIC BILBAO", "ATHLETIC CLUB", "BILBAO"], more: true },
  { slug: "deportivo-la-coruna", name: "Deportivo La Coruña", group: "club", aliases: ["LA CORUNA", "DEPORTIVO LA CORUNA"], more: true },
  { slug: "universidad-de-chile", name: "Universidad de Chile", group: "club", aliases: ["UNIVERSIDAD DE CHILE", "U DE CHILE"], more: true },
  { slug: "atletico-mineiro", name: "Atlético Mineiro", group: "club", aliases: ["ATLETICO MINEIRO"], more: true },
  { slug: "parma", name: "Parma", group: "club", aliases: ["PARMA"], more: true },
  { slug: "valencia", name: "Valencia", group: "club", aliases: ["VALENCIA", "VALENCIA CF"], more: true },
  { slug: "gremio", name: "Grêmio", group: "club", aliases: ["GREMIO"], more: true },
  { slug: "schalke-04", name: "Schalke 04", group: "club", aliases: ["SCHALKE 04", "SCHALKE"], more: true },
  { slug: "cruz-azul", name: "Cruz Azul", group: "club", aliases: ["CRUZ AZUL"], more: true },
  { slug: "real-zaragoza", name: "Real Zaragoza", group: "club", aliases: ["REAL ZARAGOZA", "ZARAGOZA"], more: true },
  { slug: "sheffield-wednesday", name: "Sheffield Wednesday", group: "club", aliases: ["SHEFFIELD WEDNESDAY"], more: true },
  { slug: "celta-de-vigo", name: "Celta de Vigo", group: "club", aliases: ["CELTA DE VIGO", "CELTA VIGO", "CELTA"], more: true },
  { slug: "bahia", name: "Bahia", group: "club", aliases: ["BAHIA"], more: true },
  { slug: "real-oviedo", name: "Real Oviedo", group: "club", aliases: ["REAL OVIEDO", "OVIEDO"], more: true },
  { slug: "st-pauli", name: "St. Pauli", group: "club", aliases: ["ST PAULI", "SANKT PAULI"], more: true },
  { slug: "osasuna", name: "Osasuna", group: "club", aliases: ["OSASUNA"], more: true },
  { slug: "atlas", name: "Atlas", group: "club", aliases: ["ATLAS"], more: true },
  { slug: "sporting-gijon", name: "Sporting de Gijón", group: "club", aliases: ["SPORTING GIJON", "GIJON"], more: true },
  { slug: "lazio", name: "Lazio", group: "club", aliases: ["LAZIO"], more: true },
  { slug: "psv", name: "PSV Eindhoven", group: "club", aliases: ["PSV", "PSV EINDHOVEN"], more: true },
  { slug: "inter-miami", name: "Inter Miami", group: "club", aliases: ["INTER MIAMI"], more: true },
  { slug: "wolves", name: "Wolverhampton", group: "club", aliases: ["WOLVES", "WOLVERHAMPTON"], more: true },
  { slug: "alaves", name: "Alavés", group: "club", aliases: ["ALAVES", "DEPORTIVO ALAVES"], more: true },
  { slug: "werder-bremen", name: "Werder Bremen", group: "club", aliases: ["WERDER BREMEN"], more: true },
  { slug: "west-ham", name: "West Ham", group: "club", aliases: ["WEST HAM", "WEST HAM UNITED"], more: true },
  { slug: "lyon", name: "Lyon", group: "club", aliases: ["LYON", "OLYMPIQUE LYON", "OLYMPIQUE LYONNAIS"], more: true },
  { slug: "sao-paulo", name: "São Paulo", group: "club", aliases: ["SAO PAULO"], more: true },
  { slug: "botafogo", name: "Botafogo", group: "club", aliases: ["BOTAFOGO"], more: true },
  { slug: "birmingham-city", name: "Birmingham City", group: "club", aliases: ["BIRMINGHAM CITY", "BIRMINGHAM"], more: true },
  { slug: "la-galaxy", name: "LA Galaxy", group: "club", aliases: ["LA GALAXY"], more: true },
  { slug: "penarol", name: "Peñarol", group: "club", aliases: ["PENAROL", "ATLETICO PENAROL"], more: true },
  { slug: "rangers", name: "Rangers", group: "club", aliases: ["RANGERS", "GLASGOW RANGERS"], excludes: ["QUEENS PARK RANGERS", "QPR"], more: true },
  { slug: "everton", name: "Everton", group: "club", aliases: ["EVERTON", "EVE"], more: true },
  { slug: "panathinaikos", name: "Panathinaikos", group: "club", aliases: ["PANATHINAIKOS"], more: true },
  { slug: "sunderland", name: "Sunderland", group: "club", aliases: ["SUNDERLAND"], more: true },
  { slug: "malaga", name: "Málaga", group: "club", aliases: ["MALAGA"], more: true },
  { slug: "monchengladbach", name: "Borussia Mönchengladbach", group: "club", aliases: ["MONCHENGLADBACH", "GLADBACH", "BORUSSIA MONCHENGLADBACH"], more: true },
  { slug: "crystal-palace", name: "Crystal Palace", group: "club", aliases: ["CRYSTAL PALACE"], more: true },
  { slug: "rayo-vallecano", name: "Rayo Vallecano", group: "club", aliases: ["RAYO VALLECANO"], more: true },
  { slug: "nottingham-forest", name: "Nottingham Forest", group: "club", aliases: ["NOTTINGHAM FOREST", "NOTTM FOREST"], more: true },
  { slug: "southampton", name: "Southampton", group: "club", aliases: ["SOUTHAMPTON"], more: true },
  { slug: "bayer-leverkusen", name: "Bayer Leverkusen", group: "club", aliases: ["BAYER LEVERKUSEN", "LEVERKUSEN"], more: true },
  { slug: "mallorca", name: "Mallorca", group: "club", aliases: ["MALLORCA"], more: true },
  { slug: "real-sociedad", name: "Real Sociedad", group: "club", aliases: ["REAL SOCIEDAD"], more: true },
  { slug: "estrella-roja", name: "Estrella Roja", group: "club", aliases: ["CRVENA ZVEZDA", "RED STAR", "RED STAR BELGRADE"], more: true },
  { slug: "leicester-city", name: "Leicester City", group: "club", aliases: ["LEICESTER CITY", "LEICESTER"], more: true },
  { slug: "hannover-96", name: "Hannover 96", group: "club", aliases: ["HANNOVER 96", "HANNOVER"], more: true },
  { slug: "racing-de-santander", name: "Racing de Santander", group: "club", aliases: ["RACING DE SANTANDER", "RACING SANTANDER"], more: true },
  { slug: "derby-county", name: "Derby County", group: "club", aliases: ["DERBY COUNTY"], more: true },
  { slug: "al-hilal", name: "Al Hilal", group: "club", aliases: ["AL HILAL"], more: true },
  { slug: "las-palmas", name: "Las Palmas", group: "club", aliases: ["LAS PALMAS"], more: true },
  { slug: "sampdoria", name: "Sampdoria", group: "club", aliases: ["SAMPDORIA"], more: true },
  { slug: "monaco", name: "Mónaco", group: "club", aliases: ["MONACO", "AS MONACO"], more: true },
  { slug: "blackburn-rovers", name: "Blackburn Rovers", group: "club", aliases: ["BLACKBURN ROVERS", "BLACKBURN"], more: true },
  { slug: "atletico-nacional", name: "Atlético Nacional", group: "club", aliases: ["ATLETICO NACIONAL"], more: true },
  { slug: "fortuna-dusseldorf", name: "Fortuna Düsseldorf", group: "club", aliases: ["FORTUNA DUSSELDORF"], more: true },
  { slug: "newells-old-boys", name: "Newell's Old Boys", group: "club", aliases: ["NEWELL S OLD BOYS", "NEWELLS OLD BOYS", "NEWELLS"], more: true },
  { slug: "getafe", name: "Getafe", group: "club", aliases: ["GETAFE"], more: true },
  { slug: "venezia", name: "Venezia", group: "club", aliases: ["VENEZIA", "VENEZIA FC"], more: true },
  { slug: "tenerife", name: "Tenerife", group: "club", aliases: ["CD TENERIFE", "TENERIFE"], more: true },
  { slug: "wolfsburg", name: "Wolfsburg", group: "club", aliases: ["WOLFSBURG", "VFL WOLFSBURG"], more: true },
  { slug: "paris-fc", name: "Paris FC", group: "club", aliases: ["PARIS FC"], more: true },
  { slug: "al-nassr", name: "Al Nassr", group: "club", aliases: ["AL NASSR"], more: true },

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

  // Más selecciones (6 o más camisetas). "Irlanda del Norte" va antes que "Irlanda", y a "Chile" se le excluye el club.
  { slug: "argelia", name: "Argelia", group: "selection", aliases: ["ALGERIA", "ARGELIA"], more: true },
  { slug: "escocia", name: "Escocia", group: "selection", aliases: ["SCOTLAND", "ESCOCIA"], more: true },
  { slug: "croacia", name: "Croacia", group: "selection", aliases: ["CROATIA", "CROACIA"], more: true },
  { slug: "ghana", name: "Ghana", group: "selection", aliases: ["GHANA"], more: true },
  { slug: "belgica", name: "Bélgica", group: "selection", aliases: ["BELGIUM", "BELGICA"], more: true },
  { slug: "noruega", name: "Noruega", group: "selection", aliases: ["NORWAY", "NORUEGA"], more: true },
  { slug: "irlanda-del-norte", name: "Irlanda del Norte", group: "selection", aliases: ["NORTHERN IRELAND", "IRLANDA DEL NORTE"], more: true },
  { slug: "irlanda", name: "Irlanda", group: "selection", aliases: ["IRELAND", "IRLANDA"], excludes: ["NORTHERN IRELAND", "IRLANDA DEL NORTE"], more: true },
  { slug: "marruecos", name: "Marruecos", group: "selection", aliases: ["MOROCCO", "MARRUECOS"], more: true },
  { slug: "nigeria", name: "Nigeria", group: "selection", aliases: ["NIGERIA"], more: true },
  { slug: "gales", name: "Gales", group: "selection", aliases: ["WALES", "GALES"], more: true },
  { slug: "camerun", name: "Camerún", group: "selection", aliases: ["CAMEROON", "CAMERUN"], more: true },
  { slug: "canada", name: "Canadá", group: "selection", aliases: ["CANADA"], more: true },
  { slug: "mali", name: "Mali", group: "selection", aliases: ["MALI"], more: true },
  { slug: "turquia", name: "Turquía", group: "selection", aliases: ["TURKEY", "TURKIYE", "TURQUIA"], more: true },
  { slug: "chile", name: "Chile", group: "selection", aliases: ["CHILE"], excludes: ["UNIVERSIDAD DE CHILE", "U DE CHILE"], more: true },
  { slug: "corea-del-sur", name: "Corea del Sur", group: "selection", aliases: ["KOREA", "SOUTH KOREA", "COREA DEL SUR"], excludes: ["NORTH KOREA"], more: true },
  { slug: "suecia", name: "Suecia", group: "selection", aliases: ["SWEDEN", "SUECIA"], more: true },
  { slug: "rumania", name: "Rumania", group: "selection", aliases: ["ROMANIA", "RUMANIA"], more: true },
  { slug: "costa-de-marfil", name: "Costa de Marfil", group: "selection", aliases: ["IVORY COAST", "COTE D IVOIRE", "COSTA DE MARFIL"], more: true },
  { slug: "cabo-verde", name: "Cabo Verde", group: "selection", aliases: ["CAPE VERDE", "CABO VERDE"], more: true },
  { slug: "haiti", name: "Haití", group: "selection", aliases: ["HAITI"], more: true },
  { slug: "sudafrica", name: "Sudáfrica", group: "selection", aliases: ["SOUTH AFRICA", "SUDAFRICA"], more: true },
  { slug: "ecuador", name: "Ecuador", group: "selection", aliases: ["ECUADOR"], more: true },
  { slug: "polonia", name: "Polonia", group: "selection", aliases: ["POLAND", "POLONIA"], more: true },
  { slug: "senegal", name: "Senegal", group: "selection", aliases: ["SENEGAL"], more: true },
  { slug: "tunez", name: "Túnez", group: "selection", aliases: ["TUNISIA", "TUNEZ"], more: true },
  { slug: "panama", name: "Panamá", group: "selection", aliases: ["PANAMA"], more: true },
  { slug: "dinamarca", name: "Dinamarca", group: "selection", aliases: ["DENMARK", "DINAMARCA"], more: true },
  { slug: "bosnia", name: "Bosnia y Herzegovina", group: "selection", aliases: ["BOSNIA AND HERZEGOVINA", "BOSNIA"], more: true },
  { slug: "burkina-faso", name: "Burkina Faso", group: "selection", aliases: ["BURKINA FASO"], more: true },
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
