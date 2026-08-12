import Link from "next/link";
import { getProducts } from "@/lib/products";
import type { Product } from "@/lib/api";
import { ProductCard } from "@/components/ProductCard";
import { Testimonials } from "@/components/Testimonials";
import { getPublishedTestimonials } from "@/lib/testimonials";
import type { Testimonial } from "@/lib/testimonials";

export const dynamic = "force-dynamic";

export default async function Home() {
  let featured: Product[] = [];
  try {
    featured = (await getProducts()).slice(0, 3);
  } catch {
    featured = [];
  }

  let testimonials: Testimonial[] = [];
  try {
    testimonials = await getPublishedTestimonials();
  } catch {
    testimonials = [];
  }

  return (
    <>
      {/* ===== HERO ===== */}
      <section className="relative overflow-hidden border-b border-thor-line">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-70"
          style={{
            background:
              "radial-gradient(60% 60% at 85% 0%, rgba(222,154,38,0.18), transparent 60%), radial-gradient(55% 55% at 0% 40%, rgba(47,143,184,0.14), transparent 60%)",
          }}
        />
        <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-5 py-16 md:grid-cols-[1.1fr_0.9fr] md:py-24">
          <div>
            <p className="mb-5 flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-[0.18em] text-thor-gold">
              <span className="inline-block h-2 w-2 rotate-45 bg-thor-gold" />
              Importado del mundo · Retro &amp; Player
            </p>
            <h1 className="text-balance font-display text-4xl leading-[0.98] tracking-wide text-thor-ink sm:text-6xl">
              Traemos la camiseta que buscás.{" "}
              <span className="text-thor-gold">De cualquier parte del mundo.</span>
            </h1>
            <p className="mt-5 max-w-md text-lg text-thor-ink-soft">
              Camisetas de fútbol retro y versión jugador, importadas. Y si no está
              en el catálogo, te la conseguimos con la tela, el número y el nombre
              que quieras.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/camisetas"
                className="rounded-xl bg-thor-gold px-6 py-3 font-mono text-sm font-bold uppercase tracking-wider text-thor-ink transition-transform hover:-translate-y-0.5"
              >
                Ver catálogo
              </Link>
              <Link
                href="/pedido-personalizado"
                className="rounded-xl border border-thor-line px-6 py-3 font-mono text-sm font-bold uppercase tracking-wider text-thor-ink transition-colors hover:border-thor-gold hover:bg-thor-gold/10"
              >
                Pedido personalizado
              </Link>
            </div>
            <ul className="mt-10 flex flex-wrap gap-x-8 gap-y-3 border-t border-thor-line pt-6">
              {["Importación directa", "Retro y versión jugador", "Envíos a todo el país"].map(
                (t) => (
                  <li
                    key={t}
                    className="flex items-center gap-2 font-mono text-xs uppercase tracking-wide text-thor-muted"
                  >
                    <span className="text-thor-land">✓</span> {t}
                  </li>
                ),
              )}
            </ul>
          </div>

          {/* Visual: camiseta + badge boarding-pass */}
          <div className="relative flex h-72 items-center justify-center md:h-96">
            <div
              className="jersey-shape flex h-64 w-56 items-center justify-center shadow-2xl shadow-black/10 md:h-80 md:w-72"
              style={{ background: "linear-gradient(160deg,#FFC44D,#DE9A26)" }}
            >
              <span className="font-display text-8xl text-thor-ink/80">10</span>
            </div>
            <div className="absolute bottom-4 right-2 rounded-xl border border-thor-line bg-thor-paper px-4 py-3 font-mono text-[11px] text-thor-muted shadow-lg md:right-0">
              <span className="block font-display text-sm tracking-wide text-thor-ink">
                RETRO 1986
              </span>
              THOR · Poliéster clásico
            </div>
          </div>
        </div>
      </section>

      {/* ===== DESTACADOS ===== */}
      <section className="mx-auto max-w-6xl px-5 py-16">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-3xl tracking-wide text-thor-ink sm:text-4xl">
              Lo más pedido
            </h2>
            <p className="mt-1 text-sm text-thor-muted">
              Una muestra de lo que tenemos importado y listo para enviar.
            </p>
          </div>
          <Link
            href="/camisetas"
            className="rounded-lg border border-thor-line px-4 py-2 font-mono text-xs font-bold uppercase tracking-wider text-thor-ink hover:border-thor-gold hover:bg-thor-gold/10"
          >
            Ver todo el catálogo
          </Link>
        </div>

        {featured.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-thor-line bg-thor-paper p-10 text-center">
            <p className="text-sm text-thor-muted">
              Estamos cargando el catálogo. Volvé en un ratito o escribinos por
              WhatsApp y te mostramos lo que tenemos.
            </p>
          </div>
        )}
      </section>

      {/* ===== TESTIMONIOS ===== */}
      <Testimonials testimonials={testimonials} />

      {/* ===== PERSONALIZADO ===== */}
      <section className="border-y border-thor-line bg-thor-cream-2">
        <div className="mx-auto max-w-6xl px-5 py-16 text-center">
          <h2 className="font-display text-3xl tracking-wide text-thor-ink sm:text-4xl">
            ¿No está en el catálogo?
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-thor-ink-soft">
            Somos importadores: decinos qué camiseta querés y la conseguimos con
            nuestros proveedores, personalizada con la tela, el parche, el número y
            el nombre que quieras.
          </p>
          <Link
            href="/pedido-personalizado"
            className="mt-7 inline-block rounded-xl bg-thor-gold px-6 py-3 font-mono text-sm font-bold uppercase tracking-wider text-thor-ink transition-transform hover:-translate-y-0.5"
          >
            Armar pedido personalizado
          </Link>
        </div>
      </section>
    </>
  );
}
