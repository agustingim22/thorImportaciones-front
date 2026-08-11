import Link from "next/link";
import type { Product } from "@/lib/api";
import { AddToCartButton } from "./AddToCartButton";

export function ProductCard({ product }: { product: Product }) {
  const isRetro = product.type === "retro";

  return (
    <article className="group relative overflow-hidden rounded-2xl border border-thor-line bg-thor-paper transition-transform duration-200 hover:-translate-y-1">
      {/* etiqueta tipo boarding pass */}
      <span className="absolute left-3 top-3 z-10 rounded-md border border-thor-line bg-thor-cream/80 px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-thor-ink-soft">
        {isRetro ? "Retro Fan" : "Player Version"}
      </span>

      {/* imagen (link al detalle) */}
      <Link
        href={`/producto/${product.slug}`}
        className="relative flex h-56 items-center justify-center bg-thor-cream-2"
      >
        {product.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.imageUrl}
            alt={product.team}
            className="h-full w-full object-cover"
          />
        ) : (
          <div
            className="jersey-shape flex h-40 w-36 items-center justify-center transition-transform group-hover:scale-105"
            style={{ background: product.colorCss }}
          >
            <span className="font-display text-5xl text-thor-ink/80">
              {product.number}
            </span>
          </div>
        )}
      </Link>

      {/* perforaciones tipo ticket + divisor punteado */}
      <div className="relative">
        <span className="absolute -left-2 top-1/2 h-4 w-4 -translate-y-1/2 rounded-full border border-thor-line bg-thor-cream" />
        <span className="absolute -right-2 top-1/2 h-4 w-4 -translate-y-1/2 rounded-full border border-thor-line bg-thor-cream" />
        <div className="border-t border-dashed border-thor-line" />
      </div>

      <div className="p-5">
        <Link href={`/producto/${product.slug}`} className="block">
          <h3 className="font-body text-base font-extrabold text-thor-ink transition-colors hover:text-thor-gold">
            {product.team}
          </h3>
        </Link>
        <p className="mt-0.5 text-xs text-thor-muted">{product.fabric}</p>

        <div className="mt-4 flex items-center justify-between gap-3">
          <span className="font-mono text-lg font-bold text-thor-gold tabular-nums">
            ${product.price.toLocaleString("es-AR")}
          </span>
          {product.inStock ? (
            <AddToCartButton
              item={{
                productId: product.id,
                team: product.team,
                price: product.price,
                imageUrl: product.imageUrl,
                colorCss: product.colorCss,
                number: product.number,
              }}
            />
          ) : (
            <span className="rounded-lg border border-thor-line px-3 py-2 font-mono text-xs font-bold uppercase tracking-wider text-thor-muted">
              Sin stock
            </span>
          )}
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
