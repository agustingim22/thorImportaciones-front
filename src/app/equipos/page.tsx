import Link from "next/link";
import type { Metadata } from "next";
import { CLUB_GROUPS, FEATURED_CLUBS, clubPath } from "@/lib/clubs";
import { getClubCounts } from "@/lib/products";
import { PageHeader } from "@/components/PageHeader";
import { SITE_URL } from "@/lib/site";

// No lee cookies/headers/searchParams: se sirve cacheada y se regenera en segundo plano.
export const revalidate = 60;

export const metadata: Metadata = {
  title: "Equipos",
  description:
    "Todas las camisetas por equipo: clubes y selecciones. Elegí el tuyo y mirá los modelos, versiones y talles disponibles.",
  alternates: { canonical: "/equipos" },
};

export default async function EquiposPage() {
  let counts: Record<string, number> = {};
  try {
    counts = await getClubCounts();
  } catch {
    counts = {};
  }
  const groups = CLUB_GROUPS.map((g) => ({
    ...g,
    items: FEATURED_CLUBS.filter((c) => c.group === g.key && (counts[c.slug] ?? 0) > 0),
  })).filter((g) => g.items.length > 0);

  // Datos estructurados para Google: migas de pan y la lista de equipos.
  const teams = groups.flatMap((g) => g.items);
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Inicio", item: SITE_URL },
        { "@type": "ListItem", position: 2, name: "Catálogo", item: `${SITE_URL}/catalogo` },
        { "@type": "ListItem", position: 3, name: "Equipos", item: `${SITE_URL}/equipos` },
      ],
    },
    ...(teams.length > 0
      ? [
          {
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            name: "Equipos",
            url: `${SITE_URL}/equipos`,
            mainEntity: {
              "@type": "ItemList",
              numberOfItems: teams.length,
              itemListElement: teams.map((c, i) => ({
                "@type": "ListItem",
                position: i + 1,
                name: `Camisetas de ${c.name}`,
                url: `${SITE_URL}${clubPath(c.slug)}`,
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
        eyebrow="Catálogo"
        title="Equipos"
        subtitle="Elegí tu club o tu selección y mirá todas sus camisetas."
      />
      <section className="mx-auto max-w-6xl px-5 py-12">
        {groups.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-thor-line bg-thor-paper p-10 text-center">
            <p className="text-sm text-thor-muted">
              Todavía no hay equipos para mostrar.{" "}
              <Link href="/catalogo" className="text-thor-gold underline">
                Ver el catálogo completo
              </Link>
            </p>
          </div>
        ) : (
          groups.map((g) => (
            <div key={g.key} className="mb-10">
              <h2 className="font-display text-2xl tracking-wide text-thor-ink">{g.label}</h2>
              <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {g.items.map((c) => (
                  <li key={c.slug}>
                    <Link
                      href={clubPath(c.slug)}
                      className="flex items-center justify-between gap-2 rounded-xl border border-thor-line bg-thor-paper px-4 py-3 text-sm text-thor-ink transition-colors hover:border-thor-gold hover:bg-thor-gold/5"
                    >
                      <span className="min-w-0 truncate font-semibold">{c.name}</span>
                      <span className="shrink-0 font-mono text-xs tabular-nums text-thor-muted">
                        {counts[c.slug]}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))
        )}
        <p className="mt-2 text-sm text-thor-muted">
          ¿No encontrás tu equipo? Buscalo por nombre en el{" "}
          <Link href="/catalogo" className="text-thor-gold underline">
            catálogo
          </Link>{" "}
          o pedinos que te lo{" "}
          <Link href="/pedido-personalizado" className="text-thor-gold underline">
            conseguimos
          </Link>
          .
        </p>
      </section>
    </>
  );
}
