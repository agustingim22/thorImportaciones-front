import Link from "next/link";
import type { Metadata } from "next";
import { getProducts, type ProductSort } from "@/lib/products";
import type { Product, ProductType } from "@/lib/api";
import { ALL_SIZES, PRODUCT_TYPES, PRODUCT_TYPE_LABELS } from "@/lib/api";
import { ProductCard } from "@/components/ProductCard";
import { PageHeader } from "@/components/PageHeader";

const SORTS: [ProductSort, string][] = [
  ["newest", "Más nuevo"],
  ["price-asc", "Precio: menor a mayor"],
  ["price-desc", "Precio: mayor a menor"],
];

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Catálogo",
  description:
    "Catálogo de camisetas de fútbol, NBA, rugby, remeras y conjuntos deportivos, importados y listos para enviar. Filtrá por tipo o buscá lo que necesitás.",
  alternates: { canonical: "/catalogo" },
};

const TABS = [
  { key: undefined, label: "Todas" },
  ...PRODUCT_TYPES.map((key) => ({ key, label: PRODUCT_TYPE_LABELS[key] })),
] as const;

export default async function CatalogoPage(props: PageProps<"/catalogo">) {
  const sp = await props.searchParams;
  const rawType = Array.isArray(sp.type) ? sp.type[0] : sp.type;
  const type = PRODUCT_TYPES.includes(rawType as ProductType) ? (rawType as ProductType) : undefined;
  const q = (Array.isArray(sp.q) ? sp.q[0] : sp.q)?.trim() || undefined;

  const minPriceRaw = Number(Array.isArray(sp.minPrice) ? sp.minPrice[0] : sp.minPrice);
  const maxPriceRaw = Number(Array.isArray(sp.maxPrice) ? sp.maxPrice[0] : sp.maxPrice);
  const minPrice = Number.isFinite(minPriceRaw) && minPriceRaw > 0 ? minPriceRaw : undefined;
  const maxPrice = Number.isFinite(maxPriceRaw) && maxPriceRaw > 0 ? maxPriceRaw : undefined;

  const sortRaw = Array.isArray(sp.sort) ? sp.sort[0] : sp.sort;
  const sort: ProductSort = SORTS.some(([key]) => key === sortRaw) ? (sortRaw as ProductSort) : "newest";

  const sizeRaw = Array.isArray(sp.size) ? sp.size[0] : sp.size;
  const size = (ALL_SIZES as readonly string[]).includes(sizeRaw ?? "") ? sizeRaw : undefined;

  let products: Product[] = [];
  try {
    products = await getProducts({ type, q, minPrice, maxPrice, size, sort });
  } catch {
    products = [];
  }

  const tabHref = (key?: string) => {
    const params = new URLSearchParams();
    if (key) params.set("type", key);
    if (q) params.set("q", q);
    if (minPrice !== undefined) params.set("minPrice", String(minPrice));
    if (maxPrice !== undefined) params.set("maxPrice", String(maxPrice));
    if (size) params.set("size", size);
    if (sort !== "newest") params.set("sort", sort);
    const qs = params.toString();
    return qs ? `/catalogo?${qs}` : "/catalogo";
  };

  const hasExtraFilters =
    !!q || minPrice !== undefined || maxPrice !== undefined || !!size || sort !== "newest";
  const clearHref = type ? `/catalogo?type=${type}` : "/catalogo";

  return (
    <>
      <PageHeader
        eyebrow="Camisetas, remeras y más"
        title="Catálogo"
        subtitle="Importado y disponible para envío. Filtrá por categoría o buscá lo que necesitás."
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

          {/* Buscador + filtros: grilla de 2 columnas en mobile, una sola fila desde sm */}
          <form
            method="get"
            action="/catalogo"
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
                Resultados para <strong className="text-thor-ink">“{q}”</strong> ({products.length}).{" "}
              </>
            ) : (
              <>{products.length} resultado{products.length === 1 ? "" : "s"} con estos filtros. </>
            )}
            <Link href={clearHref} className="text-thor-gold underline">
              Limpiar filtros
            </Link>
          </p>
        )}

        {products.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
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
