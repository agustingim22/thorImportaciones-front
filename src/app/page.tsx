import { getHealth, getProducts, API_BASE_URL, type Product } from "@/lib/api";

export const dynamic = "force-dynamic"; // siempre consulta la API en vivo

export default async function Home() {
  let products: Product[] = [];
  let apiOk = false;
  let apiError = "";

  try {
    const [health, prods] = await Promise.all([getHealth(), getProducts()]);
    apiOk = health.status === "ok";
    products = prods;
  } catch (e) {
    apiError = e instanceof Error ? e.message : "error desconocido";
  }

  return (
    <main className="mx-auto flex min-h-full w-full max-w-3xl flex-1 flex-col justify-center gap-10 px-6 py-16">
      {/* Marca provisoria — el logo real y el diseño completo llegan en el Tramo 01 */}
      <div className="flex items-baseline gap-3">
        <span
          aria-hidden
          className="grid h-9 w-9 place-items-center rounded-lg bg-thor-gold font-black text-thor-ink"
        >
          T
        </span>
        <div className="leading-none">
          <p className="text-xl font-extrabold tracking-tight text-thor-ink dark:text-thor-cream">
            THOR IMPORTACIONES
          </p>
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-thor-muted">
            Camisetas de fútbol
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <span className="w-fit rounded-full bg-thor-gold/15 px-3 py-1 font-mono text-xs font-bold uppercase tracking-widest text-thor-gold">
          Tramo 00 · Fundaciones
        </span>
        <h1 className="text-balance text-3xl font-extrabold tracking-tight text-thor-ink dark:text-thor-cream sm:text-4xl">
          Base del proyecto lista.
        </h1>
        <p className="max-w-prose text-thor-muted">
          Front en Next.js y API en C# .NET, conectados. Esta página es
          provisoria: solo verifica que todo funciona de punta a punta. La
          identidad visual y las páginas reales llegan en el Tramo 01.
        </p>
      </div>

      {/* Estado de conexión con la API */}
      <section className="rounded-2xl border border-thor-line/70 bg-thor-paper p-6 dark:border-white/10 dark:bg-white/5">
        <div className="flex items-center gap-3">
          <span
            className={`h-2.5 w-2.5 rounded-full ${apiOk ? "bg-thor-land" : "bg-red-500"}`}
            aria-hidden
          />
          <h2 className="font-semibold text-thor-ink dark:text-thor-cream">
            {apiOk ? "API conectada" : "API sin conexión"}
          </h2>
          <code className="ml-auto font-mono text-xs text-thor-muted">
            {API_BASE_URL}
          </code>
        </div>

        {apiOk ? (
          <div className="mt-5">
            <p className="text-sm text-thor-muted">
              La API devolvió{" "}
              <strong className="text-thor-ink dark:text-thor-cream">
                {products.length}
              </strong>{" "}
              camisetas de ejemplo:
            </p>
            <ul className="mt-3 grid gap-2 sm:grid-cols-2">
              {products.map((p) => (
                <li
                  key={p.id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-thor-line/60 px-3 py-2 text-sm dark:border-white/10"
                >
                  <span className="truncate text-thor-ink dark:text-thor-cream">
                    {p.team}
                  </span>
                  <span className="font-mono text-thor-gold tabular-nums">
                    ${p.price.toLocaleString("es-AR")}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="mt-4 rounded-lg bg-thor-cream/60 p-4 text-sm text-thor-muted dark:bg-black/20">
            <p>
              No pude hablar con la API{apiError ? ` (${apiError})` : ""}. Para
              levantarla, en otra terminal:
            </p>
            <pre className="mt-2 overflow-x-auto rounded bg-thor-ink px-3 py-2 font-mono text-xs text-thor-cream">
              cd thor-backend{"\n"}dotnet run --project src/Thor.Api
            </pre>
          </div>
        )}
      </section>
    </main>
  );
}
