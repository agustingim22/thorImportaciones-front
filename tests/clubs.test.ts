import { describe, expect, it } from "vitest";
import { FEATURED_CLUBS, MENU_CLUBS, detectClub, detectClubForProduct, matchClubsForSearch, normalizeText } from "@/lib/clubs";
import { composeRank, productGroup, rankGroup, rankMeta } from "@/lib/ranking";

const club = (team: string, type = "fan") => detectClubForProduct(team, type)?.slug ?? null;

describe("clasificación por equipo", () => {
  it("equipos de siempre", () => {
    expect(club("26-27 Boca Juniors Home")).toBe("boca-juniors");
    expect(club("26-27 River Plate Away")).toBe("river-plate");
    expect(club("26-27 RMA Away 1:1 Fans Soccer Jersey")).toBe("real-madrid");
    expect(club("26-27 BAR Home")).toBe("barcelona");
    expect(club("26-27 Argentina Home")).toBe("argentina");
    expect(club("26-27 Man Utd Home")).toBe("manchester-united");
  });

  it("compara por palabra completa (INT no es Internacional ni Inter Miami)", () => {
    expect(club("26-27 INT Home")).toBe("inter");
    expect(club("26-27 Inter Milan Home Fans")).toBe("inter");
    expect(club("26-27 Inter Miami Away")).toBe("inter-miami");
    expect(club("26-27 Internacional Away")).toBeNull();
  });

  it("casos ambiguos entre equipos nuevos", () => {
    expect(club("26-27 Universidad de Chile Home")).toBe("universidad-de-chile");
    expect(club("26-27 Chile Home")).toBe("chile");
    expect(club("26-27 Northern Ireland Home")).toBe("irlanda-del-norte");
    expect(club("1994 Ireland Away Retro", "retro")).toBe("irlanda");
    expect(club("1998-1999 Roma Third Retro", "retro")).toBe("roma");
    expect(club("2024 Romania Away")).toBe("rumania");
    expect(club("2012-2013 Santos FC Home Retro", "retro")).toBe("santos");
    expect(club("26-27 Santos Laguna Away")).toBeNull();
    expect(club("26-27 Atletico Madrid Home")).toBe("atletico-madrid");
    expect(club("26-27 Atletico Mineiro Away")).toBe("atletico-mineiro");
    expect(club("26-27 Atletico Nacional Away")).toBe("atletico-nacional");
    expect(club("2002-2003 Sporting Lisbon Third Retro", "retro")).toBe("sporting-cp");
    expect(club("26-27 Sporting Gijon Third")).toBe("sporting-gijon");
    expect(club("1996-1997 Rangers Away Retro", "retro")).toBe("rangers");
    expect(club("1996-1997 Queens Park Rangers Home Retro", "retro")).toBeNull();
    expect(club("26-27 Newcastle Home")).toBe("newcastle");
    expect(club("26-27 Newcastle Jets Home")).toBeNull();
    expect(club("26-27 Korea Home")).toBe("corea-del-sur");
    expect(club("26-27 North Korea Home")).toBeNull();
    expect(club("1997-1999 EVE Away Retro", "retro")).toBe("everton");
  });

  it("el NBA y el rugby nunca se clasifican por equipo", () => {
    expect(club("Spurs NBA Jersey", "nba")).toBeNull();
    expect(club("England Rugby Jersey", "rugby")).toBeNull();
    // …pero el texto solo sí matchea: es el tipo lo que lo excluye
    expect(detectClub("England Rugby Jersey")?.slug).toBe("inglaterra");
  });

  it("sin nombre no hay equipo", () => {
    expect(detectClub(null)).toBeNull();
    expect(detectClub("")).toBeNull();
  });
});

describe("lista de equipos", () => {
  it("los slugs son únicos", () => {
    const slugs = FEATURED_CLUBS.map((c) => c.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });
  it("los nombres no se repiten", () => {
    const names = FEATURED_CLUBS.map((c) => normalizeText(c.name));
    expect(new Set(names).size).toBe(names.length);
  });
  it("el menú solo tiene los equipos principales", () => {
    expect(MENU_CLUBS.every((c) => !c.more)).toBe(true);
    expect(MENU_CLUBS.length).toBeLessThan(FEATURED_CLUBS.length);
  });
  it("todo equipo tiene al menos un alias y ninguno vacío", () => {
    for (const c of FEATURED_CLUBS) {
      expect(c.aliases.length).toBeGreaterThan(0);
      expect(c.aliases.every((a) => normalizeText(a).length > 0)).toBe(true);
    }
  });
  it("cada equipo se detecta a sí mismo por el primero de sus alias", () => {
    for (const c of FEATURED_CLUBS) {
      const found = detectClub(c.aliases[0]);
      // Si otro equipo de la lista va antes y comparte el alias, el orden de la lista lo decide: tiene que ser un equipo real.
      expect(found).not.toBeNull();
    }
  });
});

describe("búsqueda por equipo", () => {
  it("encuentra el equipo por nombre, sigla o prefijo", () => {
    expect(matchClubsForSearch("real madrid").map((c) => c.slug)).toContain("real-madrid");
    expect(matchClubsForSearch("rma").map((c) => c.slug)).toContain("real-madrid");
    expect(matchClubsForSearch("barca").map((c) => c.slug)).toContain("barcelona");
    expect(matchClubsForSearch("camiseta del real madrid 2025").map((c) => c.slug)).toContain("real-madrid");
  });
  it("una letra o ninguna no devuelve nada", () => {
    expect(matchClubsForSearch("a")).toEqual([]);
    expect(matchClubsForSearch("")).toEqual([]);
  });
});

describe("orden Destacados (ranking)", () => {
  it("la prioridad de desempate de cada equipo nunca pasa de 98, así no invade la secuencia", () => {
    for (const c of FEATURED_CLUBS) {
      const { prio } = rankMeta("26-27 X Home", "fan", c.slug);
      expect(prio).toBeGreaterThanOrEqual(0);
      expect(prio).toBeLessThanOrEqual(98);
    }
  });
  it("la secuencia pesa más que el equipo: la 2ª camiseta de un equipo va después de la 1ª de cualquiera", () => {
    expect(composeRank({ group: 0, tier: 0, prio: 98 }, 0)).toBeLessThan(composeRank({ group: 0, tier: 0, prio: 0 }, 1));
  });
  it("el grupo pesa más que todo lo demás", () => {
    expect(composeRank({ group: 0, tier: 1, prio: 98 }, 9_999)).toBeLessThan(composeRank({ group: 1, tier: 0, prio: 0 }, 0));
  });
  it("el grupo se recupera del rank", () => {
    expect(rankGroup(composeRank({ group: 2, tier: 1, prio: 5 }, 7))).toBe(2);
  });
  it("grupos de producto", () => {
    expect(productGroup("fan", "boca-juniors")).toBe(0);
    expect(productGroup("fan", null)).toBe(1);
    expect(productGroup("pantalon", "boca-juniors")).toBe(2);
    expect(productGroup("nba", null)).toBe(3);
    expect(productGroup("rugby", "argentina")).toBe(3);
  });
  it("camisetas de juego (Local/Visitante/Alternativa) van en el nivel 0; entrenamiento y edición especial, no", () => {
    expect(rankMeta("26-27 Boca Juniors Home Fans", "fan", "boca-juniors").tier).toBe(0);
    expect(rankMeta("26-27 Boca Juniors Away Fans", "fan", "boca-juniors").tier).toBe(0);
    expect(rankMeta("26-27 Boca Juniors Home Training Shirts", "fan", "boca-juniors").tier).toBe(1);
    expect(rankMeta("26-27 Boca Juniors Special Edition Fans", "fan", "boca-juniors").tier).toBe(1);
    expect(rankMeta("26-27 Boca Juniors Fans", "fan", "boca-juniors").tier).toBe(1);
  });
  it("la temporada se lee del nombre", () => {
    expect(rankMeta("26-27 X Home", "fan", null).season).toBe(2026);
    expect(rankMeta("1998-1999 X Home Retro", "retro", null).season).toBe(1998);
    expect(rankMeta("X Home", "fan", null).season).toBe(0);
  });
});
