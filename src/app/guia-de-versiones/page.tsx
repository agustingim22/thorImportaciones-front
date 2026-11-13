import Link from "next/link";
import type { Metadata } from "next";
import { PageHeader } from "@/components/PageHeader";
import { SITE, SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "Fan, jugador o retro: cuál elegir",
  description:
    "Diferencias entre la versión fan, la versión jugador y las camisetas retro: corte, tela, calce y talle. Elegí la que más te conviene antes de comprar.",
  alternates: { canonical: "/guia-de-versiones" },
};

// Las medidas salen de la guía de talles (/talles): son de fábrica, tomadas en plano, para el talle M.
const VERSIONS = [
  {
    key: "fan",
    name: "Versión Fan",
    fit: "Corte más holgado",
    fabric: "Poliéster clásico",
    width: "50-52 cm",
    forYou: "Si buscás comodidad y un calce suelto, para usarla todos los días o ir a la cancha.",
    href: "/catalogo?type=fan",
  },
  {
    key: "player",
    name: "Versión Jugador",
    fit: "Slim fit, más ajustada al cuerpo",
    fabric: "Dry-fit, igual a la que usan los jugadores en cancha",
    width: "45-47 cm",
    forYou: "Si preferís un calce pegado al cuerpo y una tela liviana, como la de los jugadores.",
    href: "/catalogo?type=player",
  },
  {
    key: "retro",
    name: "Retro",
    fit: "Modelos de temporadas pasadas, en manga corta o larga",
    fabric: "Según el modelo",
    width: "48-50 cm",
    forYou: "Si sos coleccionista o querés la camiseta de una temporada que marcó una época.",
    href: "/catalogo?type=retro",
  },
] as const;

const FAQS: [string, string][] = [
  [
    "¿Cuál es la diferencia entre la versión fan y la de jugador?",
    "La fan tiene un corte más holgado y es de poliéster clásico. La de jugador es slim fit y está hecha en tela dry-fit, igual a la que usan los jugadores en cancha. En números: una talle M fan mide 50-52 cm de ancho y una M de jugador 45-47 cm, o sea unos 5 cm menos (medidas de fábrica, tomadas en plano).",
  ],
  [
    "¿Cuál me conviene si es mi primera camiseta?",
    "La versión fan: al ser más holgada perdona más si dudás con el talle. Si te gusta el calce ajustado, la de jugador es la indicada, y ahí conviene revisar bien las medidas.",
  ],
  [
    "¿Qué talle tengo que pedir?",
    "Compará tus medidas con la guía de talles de cada versión, porque no calzan igual. Si estás entre dos talles en la versión jugador, que es más ajustada, lo más seguro es el más grande.",
  ],
  [
    "¿Le puedo poner nombre y número?",
    "Sí. En las camisetas podés elegir nombre, número y parche cuando el modelo no los trae ya definidos.",
  ],
  [
    "¿Cuánto tarda en llegar?",
    `${SITE.delivery.stock}.`,
  ],
  [
    "¿Puedo cambiar el talle?",
    "Sí, dentro de las 72 hs de recibido y sin uso, para camisetas de catálogo.",
  ],
];

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Inicio", item: SITE_URL },
    { "@type": "ListItem", position: 2, name: "Guía de versiones", item: `${SITE_URL}/guia-de-versiones` },
  ],
};

export default function GuiaDeVersionesPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
      <PageHeader
        eyebrow="Guía"
        title="Fan, jugador o retro: ¿cuál elegir?"
        subtitle="Las tres versiones que tenemos, qué cambia entre una y otra y cómo no equivocarte con el talle."
      />

      <section className="mx-auto max-w-5xl px-5 py-14">
        <div className="grid gap-5 md:grid-cols-3">
          {VERSIONS.map((v) => (
            <article key={v.key} className="flex flex-col rounded-2xl border border-thor-line bg-thor-paper p-6">
              <h2 className="font-display text-2xl tracking-wide text-thor-ink">{v.name}</h2>
              <dl className="mt-4 space-y-3 text-sm">
                <div>
                  <dt className="font-mono text-[11px] uppercase tracking-wide text-thor-muted">Corte</dt>
                  <dd className="text-thor-ink">{v.fit}</dd>
                </div>
                <div>
                  <dt className="font-mono text-[11px] uppercase tracking-wide text-thor-muted">Tela</dt>
                  <dd className="text-thor-ink">{v.fabric}</dd>
                </div>
                <div>
                  <dt className="font-mono text-[11px] uppercase tracking-wide text-thor-muted">Ancho en talle M</dt>
                  <dd className="text-thor-ink">{v.width}</dd>
                </div>
              </dl>
              <p className="mt-4 flex-1 text-sm text-thor-ink-soft">
                <strong className="text-thor-ink">Es para vos </strong>
                {v.forYou.charAt(0).toLowerCase() + v.forYou.slice(1)}
              </p>
              <Link
                href={v.href}
                className="mt-5 w-fit rounded-lg bg-thor-ink px-4 py-2 font-mono text-xs font-bold uppercase tracking-wider text-thor-cream transition-colors hover:bg-thor-ink-soft"
              >
                Ver {v.name.toLowerCase()} →
              </Link>
            </article>
          ))}
        </div>
        <p className="mt-4 text-xs text-thor-muted">
          Medidas de fábrica del talle M, tomadas en plano (no del cuerpo); pueden variar 1 a 3 cm. La tabla completa
          de cada versión está en la{" "}
          <Link href="/talles" className="text-thor-gold underline">
            guía de talles
          </Link>
          .
        </p>
      </section>

      <section className="mx-auto max-w-3xl px-5 pb-20">
        <h2 className="font-display text-3xl tracking-wide text-thor-ink">Preguntas frecuentes</h2>
        <div className="mt-6 divide-y divide-thor-line rounded-2xl border border-thor-line bg-thor-paper">
          {FAQS.map(([q, a]) => (
            <details key={q} className="group px-5 py-4">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-body font-bold text-thor-ink">
                {q}
                <span className="font-mono text-thor-gold transition-transform group-open:rotate-45">+</span>
              </summary>
              <p className="mt-3 text-sm text-thor-muted">{a}</p>
            </details>
          ))}
        </div>
        <p className="mt-6 text-sm text-thor-muted">
          ¿Buscás una camiseta que no está en la web?{" "}
          <Link href="/pedido-personalizado" className="text-thor-gold underline">
            Te la conseguimos
          </Link>
          , o escribinos por{" "}
          <Link href="/contacto" className="text-thor-gold underline">
            contacto
          </Link>
          .
        </p>
      </section>
    </>
  );
}
