import type { Testimonial } from "@/lib/testimonials";

export function Testimonials({ testimonials }: { testimonials: Testimonial[] }) {
  if (testimonials.length === 0) return null;

  return (
    <section className="mx-auto max-w-6xl px-5 py-16">
      <div className="mb-8">
        <h2 className="font-display text-3xl tracking-wide text-thor-ink sm:text-4xl">
          Lo que dicen nuestros clientes
        </h2>
      </div>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {testimonials.map((t) => (
          <figure
            key={t.id}
            className="flex flex-col rounded-2xl border border-thor-line bg-thor-paper p-5"
          >
            <div aria-hidden className="text-thor-gold">
              {"★".repeat(t.rating)}
              {"☆".repeat(5 - t.rating)}
            </div>
            <blockquote className="mt-2 flex-1 text-sm leading-relaxed text-thor-ink-soft">
              “{t.comment}”
            </blockquote>
            <figcaption className="mt-4 font-mono text-xs font-bold uppercase tracking-wider text-thor-ink">
              {t.name}
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}
