import { PageHeader } from "@/components/PageHeader";

/** Se muestra al instante mientras se resuelve la página real (que hace consultas
 *  a la base) — evita que la navegación entre categorías/filtros se sienta trabada. */
export default function CatalogoLoading() {
  return (
    <>
      <PageHeader
        decorative
        eyebrow="Camisetas, remeras y más"
        title="Catálogo"
        subtitle="Importado y disponible para envío. Filtrá por categoría o buscá lo que necesitás."
      />
      <section className="mx-auto max-w-6xl px-5 py-12">
        <div className="mb-8 h-[76px] animate-pulse rounded-xl bg-thor-cream-2 sm:h-11" />
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="overflow-hidden rounded-2xl border border-thor-line bg-thor-paper">
              <div className="aspect-square animate-pulse bg-thor-cream-2" />
              <div className="space-y-2 p-4">
                <div className="h-3 w-3/4 animate-pulse rounded bg-thor-cream-2" />
                <div className="h-3 w-1/3 animate-pulse rounded bg-thor-cream-2" />
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
