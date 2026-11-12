/**
 * Nombre "para el cliente" de un producto. El proveedor nombra todo en inglés y con siglas
 * ("26-27 RMA Away 1:1 Fans Soccer Jersey"); acá se muestra como
 * "Real Madrid · Visitante 26/27 · 1:1". Es solo presentación: la base de datos, las URLs y el
 * admin siguen usando el nombre original (`Product.team`).
 *
 * Seguro para cliente y servidor. Solo transforma nombres con pinta de proveedor (empiezan con
 * una temporada y traen palabras conocidas); cualquier otro nombre —por ejemplo uno que cargaron a
 * mano en español— se devuelve tal cual. Las palabras que no conoce las deja como están.
 */
import { NO_CLUB_TYPES, detectClub, normalizeText } from "./clubs";

type Kind = "kit" | "color" | "version" | "shorts" | "extra" | "drop";

// [palabras en inglés separadas por espacio, traducción, tipo]
const VOCAB_SOURCE: [string, string, Kind][] = [
  // camiseta / edición
  ["home", "Local", "kit"],
  ["away", "Visitante", "kit"],
  ["third", "Alternativa", "kit"],
  ["fourth", "Cuarta", "kit"],
  ["goalkeeper", "Arquero", "kit"],
  ["training shirts", "Entrenamiento", "kit"],
  ["training shirt", "Entrenamiento", "kit"],
  ["training", "Entrenamiento", "kit"],
  ["long sleeve", "Manga larga", "kit"],
  ["special edition", "Edición especial", "kit"],
  ["limited edition", "Edición limitada", "kit"],
  ["commemorative edition", "Edición conmemorativa", "kit"],
  ["casual edition", "Casual", "kit"],
  ["joint edition", "Edición conjunta", "kit"],
  ["city edition", "City Edition", "kit"],
  ["icon edition", "Icon Edition", "kit"],
  ["statement edition", "Statement Edition", "kit"],
  ["association edition", "Association Edition", "kit"],
  ["anniversary", "Aniversario", "kit"],
  ["gold cup", "Copa Oro", "kit"],
  ["club world cup", "Mundial de Clubes", "kit"],
  ["print sponsors", "Con sponsors", "kit"],
  ["print sponsor", "Con sponsors", "kit"],
  ["halloween", "Halloween", "kit"],
  ["oktoberfest", "Oktoberfest", "kit"],
  // versión
  ["player version", "Versión jugador", "version"],
  ["retro", "Retro", "version"],
  // shorts
  ["shorts pants", "Short", "shorts"],
  ["shorts", "Short", "shorts"],
  ["pants", "Short", "shorts"],
  // colores (en femenino: "camiseta blanca")
  ["white", "Blanca", "color"],
  ["black", "Negra", "color"],
  ["red", "Roja", "color"],
  ["blue", "Azul", "color"],
  ["green", "Verde", "color"],
  ["yellow", "Amarilla", "color"],
  ["grey", "Gris", "color"],
  ["gray", "Gris", "color"],
  ["pink", "Rosa", "color"],
  ["purple", "Violeta", "color"],
  ["orange", "Naranja", "color"],
  ["brown", "Marrón", "color"],
  ["beige", "Beige", "color"],
  ["gold", "Dorada", "color"],
  ["navy blue", "Azul marino", "color"],
  ["royal blue", "Azul rey", "color"],
  ["light blue", "Celeste", "color"],
  ["sky blue", "Celeste", "color"],
  ["dark blue", "Azul oscuro", "color"],
  ["fluorescent green", "Verde flúor", "color"],
  ["camouflage color", "Camuflaje", "color"],
  ["camouflage", "Camuflaje", "color"],
  // ruido que no aporta (el tipo de producto ya se muestra aparte)
  ["fans", "", "drop"],
  ["fan", "", "drop"],
  ["soccer jersey", "", "drop"],
  ["soccer", "", "drop"],
  ["jersey", "", "drop"],
  ["shirts", "", "drop"],
  ["shirt", "", "drop"],
  ["top quality hot pressing", "", "drop"],
  ["nba jersey", "", "drop"],
  ["rugby jersey", "", "drop"],
  ["ad", "", "drop"], // "(ad)" = versión con publicidad
  ["adv", "", "drop"],
];

const VOCAB = VOCAB_SOURCE.map(([en, es, kind]) => ({ words: en.split(" "), es, kind })).sort(
  (a, b) => b.words.length - a.words.length, // primero las frases más largas
);

const MASCULINE: Record<string, string> = { Blanca: "Blanco", Negra: "Negro", Roja: "Rojo", Amarilla: "Amarillo", Dorada: "Dorado" };

/** Selecciones y países: inglés (minúsculas, sin tildes) → español. También sirve para la búsqueda. */
const COUNTRIES: Record<string, string> = {
  argentina: "Argentina", brazil: "Brasil", portugal: "Portugal", japan: "Japón", spain: "España",
  france: "Francia", germany: "Alemania", england: "Inglaterra", italy: "Italia", mexico: "México",
  uruguay: "Uruguay", colombia: "Colombia", netherlands: "Países Bajos", holland: "Países Bajos",
  usa: "Estados Unidos", "united states": "Estados Unidos", canada: "Canadá", norway: "Noruega",
  sweden: "Suecia", denmark: "Dinamarca", finland: "Finlandia", iceland: "Islandia", ireland: "Irlanda",
  "northern ireland": "Irlanda del Norte", scotland: "Escocia", wales: "Gales", belgium: "Bélgica",
  switzerland: "Suiza", austria: "Austria", poland: "Polonia", czech: "Chequia", "czech republic": "Chequia",
  slovakia: "Eslovaquia", hungary: "Hungría", romania: "Rumania", bulgaria: "Bulgaria", serbia: "Serbia",
  croatia: "Croacia", slovenia: "Eslovenia", "bosnia and herzegovina": "Bosnia y Herzegovina",
  albania: "Albania", greece: "Grecia", turkey: "Turquía", ukraine: "Ucrania", russia: "Rusia",
  georgia: "Georgia", israel: "Israel", "saudi arabia": "Arabia Saudita",
  "united arab emirates": "Emiratos Árabes Unidos", qatar: "Catar", iran: "Irán", iraq: "Irak",
  jordan: "Jordania", uzbekistan: "Uzbekistán", china: "China", korea: "Corea", "south korea": "Corea del Sur",
  australia: "Australia", "new zealand": "Nueva Zelanda", indonesia: "Indonesia", philippines: "Filipinas",
  malaysia: "Malasia", thailand: "Tailandia", vietnam: "Vietnam", india: "India", egypt: "Egipto",
  morocco: "Marruecos", algeria: "Argelia", tunisia: "Túnez", nigeria: "Nigeria", ghana: "Ghana",
  senegal: "Senegal", cameroon: "Camerún", "ivory coast": "Costa de Marfil", mali: "Mali",
  "burkina faso": "Burkina Faso", "cape verde": "Cabo Verde", "dr congo": "RD Congo", uganda: "Uganda",
  "south africa": "Sudáfrica", chile: "Chile", peru: "Perú", ecuador: "Ecuador", paraguay: "Paraguay",
  bolivia: "Bolivia", venezuela: "Venezuela", "costa rica": "Costa Rica", panama: "Panamá",
  honduras: "Honduras", guatemala: "Guatemala", jamaica: "Jamaica", haiti: "Haití", curacao: "Curazao",
  cuba: "Cuba", "el salvador": "El Salvador",
};

/** Siglas del proveedor de equipos que no están entre los destacados. */
const TEAM_CODES: Record<string, string> = { eve: "Everton" };

/** Tildes que el proveedor omite en nombres de equipos. */
const ACCENT_FIXES: [RegExp, string][] = [
  [/\bAtletico\b/g, "Atlético"],
  [/\bSao Paulo\b/g, "São Paulo"],
  [/\bPenarol\b/g, "Peñarol"],
  [/\bVelez\b/g, "Vélez"],
  [/\bCordoba\b/g, "Córdoba"],
  [/\bMalaga\b/g, "Málaga"],
  [/\bAlaves\b/g, "Alavés"],
  [/\bAlmeria\b/g, "Almería"],
  [/\bCadiz\b/g, "Cádiz"],
  [/\bGijon\b/g, "Gijón"],
  [/\bLeganes\b/g, "Leganés"],
];

const norm = (t: string) => t.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

function matchVocab(tokens: string[], i: number) {
  for (const v of VOCAB) {
    if (v.words.every((w, k) => i + k < tokens.length && norm(tokens[i + k]) === w)) return { len: v.words.length, es: v.es, kind: v.kind };
  }
  return null;
}

/** "1:1" (o "1 1" cuando viene de un slug) es la calidad "réplica 1:1" del proveedor. */
function isOneToOne(tokens: string[], i: number): number {
  if (tokens[i] === "1:1") return 1;
  if (tokens[i] === "1" && tokens[i + 1] === "1") return 2;
  return 0;
}

const cap = (p: string) => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase();

/** "RONALDO #7" → "Ronaldo #7" y "ST PAULI" → "St Pauli" (solo si TODO viene en mayúsculas);
 *  "AL-Nassr" → "Al-Nassr". Las siglas dentro de un nombre mixto ("Hertha BSC", "UECL Finals") quedan igual. */
function titleCaseTeam(s: string): string {
  const allCaps = s === s.toUpperCase() && /[A-Z]{2}/.test(s);
  return s
    .split(" ")
    .map((w) => {
      if (w.includes("-")) return w.split("-").map((p) => (/^[A-Z]{2,}$/.test(p) ? cap(p) : p)).join("-");
      return allCaps && /^[A-Z]{2,}$/.test(w) ? cap(w) : w;
    })
    .join(" ");
}

function formatSeason(a: string, b?: string): string {
  if (!b) return a;
  return `${a}/${b.length === 4 ? b.slice(2) : b}`;
}

const cleanKey = (s: string) => norm(s).replace(/[^a-z0-9 ]+/g, " ").replace(/\s+/g, " ").trim();

/** Equipos del NBA: cómo vienen en el título → nombre completo con la ciudad. */
const NBA_TEAMS: Record<string, string> = {
  "sa spurs": "San Antonio Spurs", spurs: "San Antonio Spurs", jazz: "Utah Jazz", celtics: "Boston Celtics",
  "76ers": "Philadelphia 76ers", sixers: "Philadelphia 76ers", heat: "Miami Heat", hornets: "Charlotte Hornets",
  "trail blazers": "Portland Trail Blazers", blazers: "Portland Trail Blazers", clippers: "Los Angeles Clippers",
  lakers: "Los Angeles Lakers", "los angeles lakers": "Los Angeles Lakers", "la lakers": "Los Angeles Lakers",
  knicks: "New York Knicks", "new york knicks": "New York Knicks", nets: "Brooklyn Nets", rockets: "Houston Rockets",
  warriors: "Golden State Warriors", "golden state warriors": "Golden State Warriors", bulls: "Chicago Bulls",
  suns: "Phoenix Suns", mavericks: "Dallas Mavericks", mavs: "Dallas Mavericks", nuggets: "Denver Nuggets",
  bucks: "Milwaukee Bucks", raptors: "Toronto Raptors", thunder: "Oklahoma City Thunder",
  "oklahoma city thunder": "Oklahoma City Thunder", kings: "Sacramento Kings", magic: "Orlando Magic",
  hawks: "Atlanta Hawks", pacers: "Indiana Pacers", pistons: "Detroit Pistons", cavaliers: "Cleveland Cavaliers",
  cavs: "Cleveland Cavaliers", wizards: "Washington Wizards", grizzlies: "Memphis Grizzlies",
  pelicans: "New Orleans Pelicans", timberwolves: "Minnesota Timberwolves",
};

/** "PARKER #9" → "Parker #9"; "Paul 3" → "Paul #3"; "ANTETOKOUNMPO.#7" → "Antetokounmpo #7". */
function formatPlayer(tokens: string[]): string[] {
  const joined = tokens.join(" ").replace(/\.(?=#)/g, " ").replace(/\s+/g, " ").trim();
  if (!joined) return [];
  const words = joined.split(" ").map((w) => {
    if (w.startsWith("#")) return w;
    if (/^\d+$/.test(w)) return "#" + w;
    return /^[A-Z.'-]{2,}$/.test(w) ? w.split("-").map(cap).join("-") : w;
  });
  return [words.join(" ")];
}

/** Nombre en español del equipo, y las palabras que sobran detrás (ej. "Starry Sky" en
 *  "Club America Starry Sky"), que pasan a ser detalle de la camiseta. */
function resolveTeam(tokens: string[], type?: string): { name: string; rest: string[] } {
  // 0) NBA: el equipo con su ciudad y, detrás, el jugador con su número.
  if (type === "nba") {
    for (let k = Math.min(tokens.length, 3); k >= 1; k--) {
      const team = NBA_TEAMS[cleanKey(tokens.slice(0, k).join(" "))];
      if (team) return { name: team, rest: formatPlayer(tokens.slice(k)) };
    }
  }
  // 1) País o selección: la frase más larga que coincida desde el principio.
  for (let k = tokens.length; k >= 1; k--) {
    const country = COUNTRIES[cleanKey(tokens.slice(0, k).join(" "))];
    if (country) return { name: country, rest: tokens.slice(k) };
  }
  // 2) Club destacado (salvo NBA y rugby): se busca el club y después cuántas palabras ocupa su
  //    alias más largo desde el principio ("River" → "River Plate"), para no dejar sueltas las demás.
  if (!type || !NO_CLUB_TYPES.includes(type)) {
    for (let k = 1; k <= tokens.length; k++) {
      const club = detectClub(tokens.slice(0, k).join(" "));
      if (!club) continue;
      let used = k;
      for (const alias of club.aliases) {
        const words = normalizeText(alias).split(" ");
        if (words.length <= tokens.length && normalizeText(tokens.slice(0, words.length).join(" ")) === words.join(" ")) {
          used = Math.max(used, words.length);
        }
      }
      return { name: club.name, rest: tokens.slice(used) };
    }
  }
  // 3) Sigla conocida, o el nombre tal como viene (con tildes y mayúsculas arregladas).
  const whole = tokens.join(" ");
  const code = TEAM_CODES[cleanKey(whole)];
  if (code) return { name: code, rest: [] };
  let name = titleCaseTeam(whole);
  for (const [re, to] of ACCENT_FIXES) name = name.replace(re, to);
  return { name, rest: [] };
}

export function displayName(raw: string, type?: string): string {
  const original = raw.trim();
  // Fuera caracteres chinos (el proveedor agrega marcas como "(无星)") y paréntesis.
  const cleaned = original
    .replace(/\([^)]*[㐀-鿿＀-￯][^)]*\)/g, " ")
    .replace(/[㐀-鿿＀-￯]+/g, " ")
    .replace(/[()]/g, " ")
    .replace(/(\d+)(?:st|nd|rd|th)\b/gi, "$1°")
    .replace(/\s+/g, " ")
    .trim();

  const sports = type === "nba" || type === "rugby";
  const m = cleaned.match(/^(\d{4}|\d{2})(?:-(\d{4}|\d{2}))?(?=\s)/);
  // Los nombres del proveedor empiezan con la temporada; los del NBA y el rugby a veces vienen sin ella.
  if (!m && !sports) return original; // no es un nombre del proveedor: se deja como está
  const season = m ? formatSeason(m[1], m[2]) : "";
  const tokens = (m ? cleaned.slice(m[0].length) : cleaned).trim().split(" ").filter(Boolean);
  if (tokens.length === 0) return original;

  // El equipo son las palabras hasta la primera palabra conocida (la primera siempre cuenta).
  const teamTokens = [tokens[0]];
  let i = 1;
  // En el NBA, una palabra seguida de un número es el apellido del jugador ("BROWN #7"), aunque sea un color.
  const isPlayer = (k: number) => type === "nba" && /^#?\d+$/.test(tokens[k + 1] ?? "");
  while (i < tokens.length && (isPlayer(i) || (!matchVocab(tokens, i) && !isOneToOne(tokens, i)))) teamTokens.push(tokens[i++]);

  const core: string[] = [];
  const colors: string[] = [];
  const versions: string[] = [];
  let shorts = false;
  let oneToOne = false;
  let recognized = 0;
  while (i < tokens.length) {
    const one = isOneToOne(tokens, i);
    if (one) {
      oneToOne = true;
      recognized++;
      i += one;
      continue;
    }
    const hit = matchVocab(tokens, i);
    if (!hit) {
      core.push(tokens[i++]); // palabra que no conocemos: se deja como viene
      continue;
    }
    recognized++;
    i += hit.len;
    if (hit.kind === "kit") core.push(hit.es);
    else if (hit.kind === "color") colors.push(hit.es);
    else if (hit.kind === "version") {
      if (!versions.includes(hit.es)) versions.push(hit.es); // "Retro Retro" se muestra una sola vez
    }
    else if (hit.kind === "shorts") shorts = true;
  }
  if (recognized === 0) return original;

  const { name: team, rest } = resolveTeam(teamTokens, type);
  const head = [shorts ? "Short" : null, ...rest, ...core].filter(Boolean).join(" ");
  const main = [head, season].filter(Boolean).join(" ");
  const parts = [main ? `${team} · ${main}` : team];
  for (const v of versions) parts.push(v);
  if (colors.length > 0) {
    const list = colors.map((c) => (shorts ? (MASCULINE[c] ?? c) : c));
    parts.push(list.map((c, k) => (k === 0 ? c : c.toLowerCase())).join(" y "));
  }
  if (oneToOne) parts.push("1:1");
  return parts.join(" · ");
}

/** Equivalentes en inglés de lo que escribió el cliente ("noruega" → "norway"), para que la
 *  búsqueda de texto encuentre nombres del proveedor que no tienen un equipo destacado. */
export function searchEquivalents(query: string): string[] {
  const nq = norm(query).replace(/[^a-z0-9 ]+/g, " ").replace(/\s+/g, " ").trim();
  if (nq.length < 4) return [];
  const out = new Set<string>();
  for (const [en, es] of Object.entries(COUNTRIES)) {
    const nes = norm(es);
    if (nes === nq || nes.startsWith(nq)) out.add(en);
  }
  return [...out].filter((en) => en !== nq);
}
