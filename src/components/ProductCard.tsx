import Link from "next/link";
import type { Product } from "@/lib/api";
import { whatsappUrl } from "@/lib/site";

export function ProductCard({ product }: { product: Product }) {
  const isRetro = product.type === "retro";
  const consultaMsg = `¡Hola Thor! Me interesa la camiseta "${product.team}" ($${product.price.toLocaleString("es-AR")}). ¿Está disponible?`;

  return (
    <article className="group relative overflow-hidden rounded-2xl border border-thor-line bg-thor-paper transition-transform duration-200 hover:-translate-y-1">
      {/* etiqueta tipo boarding pass */}
      <span className="absolute left-3 top-3 z-10 rounded-md border border-thor-line bg-thor-cream/80 px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-thor-ink-soft">
        {isRetro ? "Retro Fan" : "Player Version"}
      </span>

      {/* imagen real si existe; si no, camiseta placeholder */}
      <div className="relative flex h-56 items-center justify-center bg-thor-cream-2">
        {product.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.imageUrl}
            alt={product.team}
            className="h-full w-full object-cover"
          />
        ) : (
          <div
            className="jersey-shape flex h-40 w-36 items-center justify-center"
            style={{ background: product.colorCss }}
          >
            <span className="font-display text-5xl text-thor-ink/80">
              {product.number}
            </span>
          </div>
        )}
      </div>

      {/* perforaciones tipo ticket + divisor punteado */}
      <div className="relative">
        <span className="absolute -left-2 top-1/2 h-4 w-4 -translate-y-1/2 rounded-full border border-thor-line bg-thor-cream" />
        <span className="absolute -right-2 top-1/2 h-4 w-4 -translate-y-1/2 rounded-full border border-thor-line bg-thor-cream" />
        <div className="border-t border-dashed border-thor-line" />
      </div>

      <div className="p-5">
        <h3 className="font-body text-base font-extrabold text-thor-ink">
          {product.team}
        </h3>
        <p className="mt-0.5 text-xs text-thor-muted">{product.fabric}</p>

        <div className="mt-4 flex items-center justify-between gap-3">
          <span className="font-mono text-lg font-bold text-thor-gold tabular-nums">
            ${product.price.toLocaleString("es-AR")}
          </span>
          <a
            href={whatsappUrl(consultaMsg)}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg bg-thor-ink px-3.5 py-2 font-mono text-xs font-bold uppercase tracking-wider text-thor-cream transition-colors hover:bg-thor-ink-soft"
          >
            Consultar
          </a>
        </div>

        <Link
          href="/pedido-personalizado"
          className="mt-3 block font-mono text-[11px] text-thor-muted underline decoration-thor-line underline-offset-4 hover:text-thor-gold"
        >
          ¿La querés con otro número o parche? Pedila personalizada →
        </Link>
      </div>
    </article>
  );
}
