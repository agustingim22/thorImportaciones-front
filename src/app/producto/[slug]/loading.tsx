/** Se muestra al instante mientras se resuelve la ficha real. Sobre todo ayuda en
 *  productos fuera de los ~50 más recientes prerenderizados, que se generan
 *  on-demand la primera vez que alguien entra. */
export default function ProductoLoading() {
  return (
    <div className="mx-auto max-w-6xl px-5 py-10">
      <div className="mb-6 h-3 w-40 animate-pulse rounded bg-thor-cream-2" />
      <div className="grid gap-10 md:grid-cols-[1.35fr_1fr]">
        <div className="aspect-square animate-pulse rounded-2xl border border-thor-line bg-thor-cream-2" />
        <div className="space-y-4">
          <div className="h-3 w-24 animate-pulse rounded bg-thor-cream-2" />
          <div className="h-7 w-3/4 animate-pulse rounded bg-thor-cream-2" />
          <div className="h-6 w-32 animate-pulse rounded bg-thor-cream-2" />
          <div className="h-24 animate-pulse rounded-xl bg-thor-cream-2" />
          <div className="h-10 w-40 animate-pulse rounded-lg bg-thor-cream-2" />
        </div>
      </div>
    </div>
  );
}
