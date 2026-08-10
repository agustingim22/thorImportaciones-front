import Link from "next/link";
import type { Metadata } from "next";
import { getProducts, type Product } from "@/lib/api";
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
  const raw = Array.isArray(sp.type) ? sp.type[0] : sp.type;
  const type = raw === "retro" || raw === "player" ? raw : undefined;

  let products: Product[] = [];
  try {
    products = await getProducts(type);
  } catch {
    products = [];
  }

  return (
    <>
      <PageHeader
        eyebrow="Catálogo"
        title="Camisetas"
        subtitle="Importadas y disponibles para envío. Elegí entre Retro Fan o Player Version."
      />

      <section className="mx-auto max-w-6xl px-5 py-12">
        {/* Filtros por tipo (via URL) */}
        <div className="mb-8 inline-flex gap-1 rounded-xl border border-thor-line bg-thor-paper p-1">
          {TABS.map((t) => {
            const active = t.key === type;
            const href = t.key ? `/camisetas?type=${t.key}` : "/camisetas";
            return (
              <Link
                key={t.label}
                href={href}
                className={`rounded-lg px-4 py-2 font-mono text-xs font-bold uppercase tracking-wider transition-colors ${
                  active
                    ? "bg-thor-gold text-thor-ink"
                    : "text-thor-muted hover:text-thor-ink"
                }`}
              >
                {t.label}
              </Link>
            );
          })}
        </div>

        {products.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-thor-line bg-thor-paper p-10 text-center">
            <p className="text-sm text-thor-muted">
              No hay camisetas para mostrar en este momento.
            </p>
          </div>
        )}
      </section>
    </>
  );
}
