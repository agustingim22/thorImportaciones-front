export function PageHeader({
  eyebrow,
  title,
  subtitle,
  decorative = false,
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
  /** Para las pantallas de carga: se ve igual pero NO es un encabezado (<h1>), así la página real
   *  no queda con dos <h1> en el HTML (el de la pantalla de carga más el suyo). */
  decorative?: boolean;
}) {
  const Heading = decorative ? "div" : "h1";
  return (
    <section className="border-b border-thor-line bg-thor-cream-2">
      <div className="mx-auto max-w-6xl px-5 py-14">
        <p className="mb-3 flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-[0.18em] text-thor-gold">
          <span className="inline-block h-2 w-2 rotate-45 bg-thor-gold" />
          {eyebrow}
        </p>
        <Heading className="font-display text-4xl tracking-wide text-thor-ink sm:text-5xl">
          {title}
        </Heading>
        {subtitle && (
          <p className="mt-3 max-w-xl text-thor-ink-soft">{subtitle}</p>
        )}
      </div>
    </section>
  );
}
