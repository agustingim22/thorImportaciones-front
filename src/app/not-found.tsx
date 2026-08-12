import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-lg flex-col items-center px-5 py-24 text-center">
      <span className="font-display text-7xl text-thor-gold">404</span>
      <h1 className="mt-4 font-display text-3xl tracking-wide text-thor-ink">
        Esta página se fue de gira
      </h1>
      <p className="mt-3 text-thor-muted">
        No encontramos lo que buscabas. Puede que el link esté roto o la camiseta ya no esté
        disponible.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link
          href="/"
          className="rounded-xl bg-thor-gold px-6 py-3 font-mono text-sm font-bold uppercase tracking-wider text-thor-ink"
        >
          Ir al inicio
        </Link>
        <Link
          href="/camisetas"
          className="rounded-xl border border-thor-line px-6 py-3 font-mono text-sm font-bold uppercase tracking-wider text-thor-ink hover:border-thor-gold"
        >
          Ver catálogo
        </Link>
      </div>
    </div>
  );
}
