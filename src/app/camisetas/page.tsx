import Link from "next/link";
import type { Metadata } from "next";
import { getProducts } from "@/lib/products";
import type { Product } from "@/lib/api";
import { ProductCard } from "@/components/ProductCard";
import { PageHeader } from "@/components/PageHeader";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Camisetas" };

const TABS = [
  { key: undefined, label: "Todas" },
  { key: "retro", label: "Retro Fan" },
  { key: "player", label: "Player Version" },
] as const;

export default async function CamisetasPage(props: PageProps<"/camisetas">) {
  const sp = await props.searchParams;
  const rawType = Array.isArray(sp.type) ? sp.type[0] : sp.type;
  const type = rawType === "retro" || rawType === "player" ? rawType : undefined;
  const q = (Array.isArray(sp.q) ? sp.q[0] : sp.q)?.trim() || undefined;

  let products: Product[] = [];
  try {
    products = await getProducts({ type, q });
  } catch {
    products = [];
  }

  const tabHref = (key?: string) => {
    const params = new URLSearchParams();
    if (key) params.set("type", key);
    if (q) params.set("q", q);
    const qs = params.toString();
    return qs ? `/camisetas?${qs}` : "/camisetas";
  };

  return (
    <>
      <PageHeader
        eyebrow="Catálogo"
        title="Camisetas"
        subtitle="Importadas y disponibles para envío. Elegí entre Retro Fan o Player Version."
      />

      <section className="mx-auto max-w-6xl px-5 py-12">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          {/* Filtros por tipo */}
          <div className="inline-flex gap-1 rounded-xl border border-thor-line bg-thor-paper p-1">
            {TABS.map((t) => {
              const active = t.key === type;
              return (
                <Link
                  key={t.label}
                  href={tabHref(t.key)}
                  className={`rounded-lg px-4 py-2 font-mono text-xs font-bold uppercase tracking-wider transition-colors ${
                    active ? "bg-thor-gold text-thor-ink" : "text-thor-muted hover:text-thor-ink"
                  }`}
                >
                  {t.label}
                </Link>
              );
            })}
          </div>

          {/* Buscador */}
          <form method="get" action="/camisetas" className="flex items-center gap-2">
            {type && <input type="hidden" name="type" value={type} />}
            <input
              type="search"
              name="q"
              defaultValue={q ?? ""}
              placeholder="Buscar equipo…"
              className="rounded-lg border border-thor-line bg-thor-paper px-3 py-2 text-sm text-thor-ink"
            />
            <button
              type="submit"
              className="rounded-lg bg-thor-ink px-4 py-2 font-mono text-xs font-bold uppercase tracking-wider text-thor-cream"
            >
              Buscar
            </button>
          </form>
        </div>

        {q && (
          <p className="mb-5 text-sm text-thor-muted">
            Resultados para <strong className="text-thor-ink">“{q}”</strong> ({products.length}).{" "}
            <Link href={tabHref(type)} className="text-thor-gold underline">
              Limpiar
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
              No encontramos camisetas con esos filtros.
            </p>
          </div>
        )}
      </section>
    </>
  );
}
