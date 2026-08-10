export function PageHeader({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <section className="border-b border-thor-line bg-thor-cream-2">
      <div className="mx-auto max-w-6xl px-5 py-14">
        <p className="mb-3 flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-[0.18em] text-thor-gold">
          <span className="inline-block h-2 w-2 rotate-45 bg-thor-gold" />
          {eyebrow}
        </p>
        <h1 className="font-display text-4xl tracking-wide text-thor-ink sm:text-5xl">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-3 max-w-xl text-thor-ink-soft">{subtitle}</p>
        )}
      </div>
    </section>
  );
}
