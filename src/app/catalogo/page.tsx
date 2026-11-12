import Link from "next/link";
import type { Metadata } from "next";
import { after } from "next/server";
import { headers } from "next/headers";
import { isBotUserAgent, logSearch } from "@/lib/server/searches";
import { DEFAULT_PAGE_SIZE, getClubCounts, getProducts, type ProductSort } from "@/lib/products";
import type { Product, ProductType } from "@/lib/api";
import { ALL_SIZES, PRODUCT_TYPES, PRODUCT_TYPE_LABELS, toCardProduct } from "@/lib/api";
import { CLUB_GROUPS, FEATURED_CLUBS, clubHeading, clubPath, getClubBySlug } from "@/lib/clubs";
import { ProductCard } from "@/components/ProductCard";
import { PageHeader } from "@/components/PageHeader";
import { SITE, SITE_URL } from "@/lib/site";

const SORTS: [ProductSort, string][] = [
  ["featured", "Destacados"], // por defecto: camisetas de equipos destacados primero (ver lib/ranking.ts)
  ["newest", "Más nuevo"],
  ["price-asc", "Precio: menor a mayor"],
  ["price-desc", "Precio: mayor a menor"],
];

// Lee searchParams, así que Next igual la renderiza dinámica en cada visita
// sin importar esto — pero la consulta cara de por sí sí queda cacheada 60s
// (ver getProducts en @/lib/products), que es lo que realmente pesa acá.
export const dynamic = "force-dynamic";

/** Cada equipo tiene su propio título y canonical (/equipo/real-madrid), para que se indexe como página propia
 *  y la dirección vieja /catalogo?club=… no cuente como contenido duplicado. */
export async function generateMetadata(props: PageProps<"/catalogo">): Promise<Metadata> {
  const sp = await props.searchParams;
  const club = getClubBySlug(Array.isArray(sp.club) ? sp.club[0] : sp.club);
  if (club) {
    const heading = clubHeading(club);
    // Descripción de ~150 caracteres (antes eran 86): con la cantidad de modelos del equipo.
    const n = (await getClubCounts().catch(() => ({}) as Record<string, number>))[club.slug];
    const long = `Camisetas de ${heading} importadas: ${n ? `${n} modelos` : "todos los modelos"} con sus versiones y talles. Elegí la tuya y pedila con envío a todo el país en ${SITE.name}.`;
    const short = `Camisetas de ${heading} importadas${n ? `: ${n} modelos` : ""} con sus versiones y talles. Envíos a todo el país.`;
    return {
      title: `Camisetas de ${heading}`,
      description: long.length <= 165 ? long : short,
      alternates: { canonical: clubPath(club.slug) },
    };
  }
  return {
    title: "Catálogo",
    description:
      "Catálogo de camisetas de fútbol, NBA, rugby, remeras y conjuntos deportivos, importados y listos para enviar. Filtrá por tipo o buscá lo que necesitás.",
    alternates: { canonical: "/catalogo" },
  };
}

const TABS = [
  { key: undefined, label: "Todas" },
  ...PRODUCT_TYPES.map((key) => ({ key, label: PRODUCT_TYPE_LABELS[key] })),
] as const;

export default async function CatalogoPage(props: PageProps<"/catalogo">) {
  const sp = await props.searchParams;
  const rawType = Array.isArray(sp.type) ? sp.type[0] : sp.type;
  const type = PRODUCT_TYPES.includes(rawType as ProductType) ? (rawType as ProductType) : undefined;
  const q = (Array.isArray(sp.q) ? sp.q[0] : sp.q)?.trim() || undefined;
  const clubInfo = getClubBySlug(Array.isArray(sp.club) ? sp.club[0] : sp.club);
  const club = clubInfo?.slug;

  const minPriceRaw = Number(Array.isArray(sp.minPrice) ? sp.minPrice[0] : sp.minPrice);
  const maxPriceRaw = Number(Array.isArray(sp.maxPrice) ? sp.maxPrice[0] : sp.maxPrice);
  const minPrice = Number.isFinite(minPriceRaw) && minPriceRaw > 0 ? minPriceRaw : undefined;
  const maxPrice = Number.isFinite(maxPriceRaw) && maxPriceRaw > 0 ? maxPriceRaw : undefined;

  const sortRaw = Array.isArray(sp.sort) ? sp.sort[0] : sp.sort;
  const sort: ProductSort = SORTS.some(([key]) => key === sortRaw) ? (sortRaw as ProductSort) : "featured";

  const sizeRaw = Array.isArray(sp.size) ? sp.size[0] : sp.size;
  const size = (ALL_SIZES as readonly string[]).includes(sizeRaw ?? "") ? sizeRaw : undefined;

  const pageRaw = Number(Array.isArray(sp.page) ? sp.page[0] : sp.page);
  const page = Number.isInteger(pageRaw) && pageRaw > 0 ? pageRaw : 1;

  let products: Product[] = [];
  let total = 0;
  let clubCounts: Record<string, number> = {};
  let loaded = false;
  try {
    const [result, counts] = await Promise.all([
      getProducts({ type, club, q, minPrice, maxPrice, size, sort, page }),
      getClubCounts(),
    ]);
    products = result.products;
    total = result.total;
    clubCounts = counts;
    loaded = true;
  } catch {
    products = [];
    total = 0;
  }
  // Se anota lo que busca la gente y cuántos resultados encontró (panel "Búsquedas"): solo la primera página, sin
  // contar buscadores ni monitores, y después de responder (`after`) para no demorar la página. Si la consulta
  // falló no se anota, para no registrar un "0 resultados" que no es real.
  if (q && page === 1 && loaded && !isBotUserAgent((await headers()).get("user-agent"))) {
    after(() => logSearch(q, total));
  }
  const totalPages = Math.max(1, Math.ceil(total / DEFAULT_PAGE_SIZE));

  // Solo se ofrecen los equipos que tienen productos (más el elegido, aunque quede en 0),
  // agrupados en clubes y selecciones.
  const visibleGroups = CLUB_GROUPS.map((g) => ({
    ...g,
    // Los equipos secundarios (`more`) no tienen chip: se llega a ellos desde /equipos o la búsqueda.
    // Si uno está elegido, igual se muestra para saber dónde estás parado.
    items: FEATURED_CLUBS.filter(
      (c) => c.group === g.key && ((!c.more && (clubCounts[c.slug] ?? 0) > 0) || c.slug === club),
    ),
  })).filter((g) => g.items.length > 0);

  const buildHref = (overrides: { type?: string; club?: string; page?: number } = {}) => {
    const params = new URLSearchParams();
    const nextType = "type" in overrides ? overrides.type : type;
    if (nextType) params.set("type", nextType);
    const nextClub = "club" in overrides ? overrides.club : club;
    if (q) params.set("q", q);
    if (minPrice !== undefined) params.set("minPrice", String(minPrice));
    if (maxPrice !== undefined) params.set("maxPrice", String(maxPrice));
    if (size) params.set("size", size);
    if (sort !== "featured") params.set("sort", sort);
    const nextPage = overrides.page ?? 1;
    if (nextPage > 1) params.set("page", String(nextPage));
    const qs = params.toString();
    // Con equipo, la dirección linda (/equipo/real-madrid); sin equipo, /catalogo.
    const base = nextClub ? clubPath(nextClub) : "/catalogo";
    return qs ? `${base}?${qs}` : base;
  };
  const tabHref = (key?: string) => buildHref({ type: key, page: 1 });
  const clubHref = (slug?: string) => buildHref({ club: slug, page: 1 });

  const hasExtraFilters =
    !!q || minPrice !== undefined || maxPrice !== undefined || !!size || sort !== "featured";
  // "Limpiar filtros" quita búsqueda, precio, talle y orden, pero conserva tipo y equipo.
  const clearBase = club ? clubPath(club) : "/catalogo";
  const clearHref = type ? `${clearBase}?type=${type}` : clearBase;

  // Texto de presentación de la página de un equipo (suma contenido para Google y orienta al cliente).
  const clubIntro = clubInfo
    ? `${clubCounts[clubInfo.slug] ? `${clubCounts[clubInfo.slug]} modelos de ${clubHeading(clubInfo)}` : `Modelos de ${clubHeading(clubInfo)}`}, importados. Elegí la versión y el talle, y pedila con envío a todo el país.`
    : null;

  // Datos estructurados para Google: migas de pan y la lista de productos de esta página.
  // No se mandan en las búsquedas: su canonical es el catálogo completo.
  const listPath = club ? clubPath(club) : "/catalogo";
  const listName = clubInfo ? `Camisetas de ${clubHeading(clubInfo)}` : "Catálogo";
  const jsonLd: Record<string, unknown>[] = q
    ? []
    : [
        {
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Inicio", item: SITE_URL },
            { "@type": "ListItem", position: 2, name: "Catálogo", item: `${SITE_URL}/catalogo` },
            ...(clubInfo ? [{ "@type": "ListItem", position: 3, name: clubInfo.name, item: `${SITE_URL}${listPath}` }] : []),
          ],
        },
        ...(products.length > 0
          ? [
              {
                "@context": "https://schema.org",
                "@type": "CollectionPage",
                name: listName,
                url: `${SITE_URL}${listPath}`,
                mainEntity: {
                  "@type": "ItemList",
                  numberOfItems: total,
                  itemListElement: products.map((p, i) => ({
                    "@type": "ListItem",
                    position: (page - 1) * DEFAULT_PAGE_SIZE + i + 1,
                    url: `${SITE_URL}/producto/${p.slug}`,
                    name: p.name,
                  })),
                },
              },
            ]
          : []),
      ];

  return (
    <>
      {jsonLd.map((d, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(d).replace(/</g, "\\u003c") }}
        />
      ))}
      <PageHeader
        eyebrow={clubInfo ? "Catálogo" : "Camisetas, remeras y más"}
        title={listName}
        subtitle={clubIntro ?? "Importado y disponible para envío. Filtrá por categoría o buscá lo que necesitás."}
      />

      <section className="mx-auto max-w-6xl px-5 py-12">
        <div className="mb-8 flex flex-col gap-4">
          {/* Filtros por tipo: tira horizontal con scroll en pantallas chicas, para
              que no se amontonen en varias filas desparejas */}
          <div className="-mx-5 overflow-x-auto px-5 sm:mx-0 sm:px-0">
            <div className="inline-flex w-max gap-1 rounded-xl border border-thor-line bg-thor-paper p-1">
              {TABS.map((t) => {
                const active = t.key === type;
                return (
                  <Link
                    key={t.label}
                    href={tabHref(t.key)}
                    className={`shrink-0 rounded-lg px-4 py-2 font-mono text-xs font-bold uppercase tracking-wider transition-colors ${
                      active ? "bg-thor-gold text-thor-ink" : "text-thor-muted hover:text-thor-ink"
                    }`}
                  >
                    {t.label}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Filtro por equipo: una tira por grupo (clubes / selecciones), con scroll en
              mobile y varias filas desde sm. "Todos" va solo en la primera tira. */}
          {visibleGroups.length > 0 && (
            <div className="flex flex-col gap-2">
              {visibleGroups.map((g, gi) => (
                <nav
                  key={g.key}
                  aria-label={`Filtrar por ${g.label.toLowerCase()}`}
                  className="-mx-5 overflow-x-auto px-5 sm:mx-0 sm:px-0"
                >
                  <div className="flex w-max items-center gap-2 sm:w-auto sm:flex-wrap">
                    <span className="w-24 shrink-0 font-mono text-[10px] font-bold uppercase tracking-widest text-thor-muted">
                      {g.label}
                    </span>
                    {[...(gi === 0 ? [{ slug: undefined, name: "Todos" }] : []), ...g.items].map((c) => {
                      const active = c.slug === club;
                      const count = c.slug ? clubCounts[c.slug] : undefined;
                      return (
                        <Link
                          key={c.slug ?? "all"}
                          href={clubHref(c.slug)}
                          aria-current={active ? "page" : undefined}
                          className={`shrink-0 rounded-full border px-3.5 py-1.5 text-sm transition-colors ${
                            active
                              ? "border-thor-gold bg-thor-gold/15 font-semibold text-thor-ink"
                              : "border-thor-line text-thor-muted hover:border-thor-gold hover:text-thor-ink"
                          }`}
                        >
                          {c.name}
                          {count !== undefined && (
                            <span className="ml-1.5 font-mono text-xs tabular-nums opacity-60">{count}</span>
                          )}
                        </Link>
                      );
                    })}
                  </div>
                </nav>
              ))}
              <Link
                href="/equipos"
                className="self-start font-mono text-[11px] font-bold uppercase tracking-wider text-thor-gold hover:underline"
              >
                Ver todos los equipos →
              </Link>
            </div>
          )}

          {/* Buscador + filtros: grilla de 2 columnas en mobile, una sola fila desde sm */}
          <form
            method="get"
            action={club ? clubPath(club) : "/catalogo"}
            className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center"
          >
            {type && <input type="hidden" name="type" value={type} />}
            <input
              type="search"
              name="q"
              defaultValue={q ?? ""}
              placeholder="Buscar equipo…"
              className="col-span-2 rounded-lg border border-thor-line bg-thor-paper px-3 py-2 text-sm text-thor-ink sm:w-auto"
            />
            <input
              type="number"
              name="minPrice"
              min={0}
              defaultValue={minPrice ?? ""}
              placeholder="Precio desde"
              className="w-full rounded-lg border border-thor-line bg-thor-paper px-3 py-2 text-sm text-thor-ink sm:w-28"
            />
            <input
              type="number"
              name="maxPrice"
              min={0}
              defaultValue={maxPrice ?? ""}
              placeholder="Precio hasta"
              className="w-full rounded-lg border border-thor-line bg-thor-paper px-3 py-2 text-sm text-thor-ink sm:w-28"
            />
            <select
              name="size"
              defaultValue={size ?? ""}
              className="w-full rounded-lg border border-thor-line bg-thor-paper px-3 py-2 text-sm text-thor-ink sm:w-auto"
            >
              <option value="">Todos los talles</option>
              {ALL_SIZES.map((s) => (
                <option key={s} value={s}>
                  Talle {s}
                </option>
              ))}
            </select>
            <select
              name="sort"
              defaultValue={sort}
              className="w-full rounded-lg border border-thor-line bg-thor-paper px-3 py-2 text-sm text-thor-ink sm:w-auto"
            >
              {SORTS.map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
            <button
              type="submit"
              className="col-span-2 rounded-lg bg-thor-ink px-4 py-2 font-mono text-xs font-bold uppercase tracking-wider text-thor-cream sm:col-span-1"
            >
              Buscar
            </button>
          </form>
        </div>

        {hasExtraFilters && (
          <p className="mb-5 text-sm text-thor-muted">
            {q ? (
              <>
                Resultados para <strong className="text-thor-ink">“{q}”</strong> ({total}).{" "}
              </>
            ) : (
              <>{total} resultado{total === 1 ? "" : "s"} con estos filtros. </>
            )}
            <Link href={clearHref} className="text-thor-gold underline">
              Limpiar filtros
            </Link>
          </p>
        )}

        {products.length > 0 ? (
          <>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {products.map((p) => (
                <ProductCard key={p.id} product={toCardProduct(p)} />
              ))}
            </div>

            {totalPages > 1 && (
              <nav className="mt-10 flex items-center justify-center gap-2">
                {page > 1 && (
                  <Link
                    href={buildHref({ page: page - 1 })}
                    className="rounded-lg border border-thor-line px-4 py-2 font-mono text-xs font-bold uppercase tracking-wider text-thor-ink hover:border-thor-gold"
                  >
                    ← Anterior
                  </Link>
                )}
                <span className="px-3 font-mono text-xs text-thor-muted">
                  Página {page} de {totalPages}
                </span>
                {page < totalPages && (
                  <Link
                    href={buildHref({ page: page + 1 })}
                    className="rounded-lg border border-thor-line px-4 py-2 font-mono text-xs font-bold uppercase tracking-wider text-thor-ink hover:border-thor-gold"
                  >
                    Siguiente →
                  </Link>
                )}
              </nav>
            )}
          </>
        ) : (
          <div className="rounded-2xl border border-dashed border-thor-line bg-thor-paper p-10 text-center">
            <p className="text-sm text-thor-muted">
              No encontramos productos con esos filtros.
            </p>
          </div>
        )}
      </section>
    </>
  );
}
