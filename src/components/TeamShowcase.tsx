import Link from "next/link";
import Image from "next/image";
import type { TeamShowcaseItem } from "@/lib/products";
import { isUnoptimizedImage, resizeSupplierImage } from "@/lib/image";
import { clubPath } from "@/lib/clubs";

/** Bloque "Comprá por equipo" de la portada: una tarjeta por equipo con la foto de una camiseta suya.
 *  Es navegación: cada tarjeta lleva a la página del equipo. Con scroll horizontal en mobile. */
export function TeamShowcase({ items }: { items: TeamShowcaseItem[] }) {
  if (items.length === 0) return null;
  return (
    <section className="mx-auto max-w-6xl px-5 pt-16">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="font-display text-3xl tracking-wide text-thor-ink sm:text-4xl">Comprá por equipo</h2>
          <p className="mt-1 text-sm text-thor-muted">Elegí tu club o tu selección.</p>
        </div>
        <Link
          href="/equipos"
          className="rounded-lg border border-thor-line px-4 py-2 font-mono text-xs font-bold uppercase tracking-wider text-thor-ink hover:border-thor-gold hover:bg-thor-gold/10"
        >
          Ver todos los equipos
        </Link>
      </div>
      <ul className="-mx-5 flex gap-3 overflow-x-auto px-5 pb-2 sm:mx-0 sm:grid sm:grid-cols-4 sm:gap-4 sm:overflow-visible sm:px-0 lg:grid-cols-6">
        {items.map((t) => (
          <li key={t.slug} className="w-36 shrink-0 sm:w-auto">
            <Link
              href={clubPath(t.slug)}
              className="group block overflow-hidden rounded-2xl border border-thor-line bg-thor-paper transition-transform duration-200 hover:-translate-y-1"
            >
              <span className="relative block aspect-square bg-thor-cream-2">
                <Image
                  src={resizeSupplierImage(t.imageUrl, 300)}
                  alt=""
                  fill
                  sizes="(max-width: 640px) 144px, (max-width: 1024px) 25vw, 16vw"
                  className="object-cover"
                  unoptimized={isUnoptimizedImage(t.imageUrl)}
                />
              </span>
              <span className="block px-3 py-2.5">
                <span className="block truncate text-sm font-extrabold text-thor-ink transition-colors group-hover:text-thor-gold">
                  {t.name}
                </span>
                <span className="block font-mono text-[11px] text-thor-muted">{t.count} productos</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
