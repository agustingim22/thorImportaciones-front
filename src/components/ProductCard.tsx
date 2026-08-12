import Link from "next/link";
import type { Product } from "@/lib/api";
import { PRODUCT_TYPE_LABELS } from "@/lib/api";
import { AddToCartButton } from "./AddToCartButton";

export function ProductCard({ product }: { product: Product }) {
  // Si el comprador tiene algo para elegir (nombre, número o parche), lo mandamos
  // al detalle a personalizar en vez de agregarlo directo desde la card.
  const isCustomizable =
    !product.presetName || !product.presetNumber || product.patches.length > 0;

  return (
    <article className="group relative overflow-hidden rounded-2xl border border-thor-line bg-thor-paper transition-transform duration-200 hover:-translate-y-1">
      {/* etiqueta tipo boarding pass */}
      <span className="absolute left-3 top-3 z-10 rounded-md border border-thor-line bg-thor-cream/80 px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-thor-ink-soft">
        {PRODUCT_TYPE_LABELS[product.type]}
      </span>

      {/* imagen (link al detalle) — tamaño fijo (1:1) para que todas las cards queden simétricas */}
      <Link
        href={`/producto/${product.slug}`}
        className="relative flex aspect-square items-center justify-center overflow-hidden bg-thor-cream-2"
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
            className="jersey-shape flex h-[64%] w-[56%] items-center justify-center transition-transform group-hover:scale-105"
            style={{ background: product.colorCss }}
          >
            {product.presetNumber && (
              <span className="font-display text-6xl text-thor-ink/80">
                {product.presetNumber}
              </span>
            )}
          </div>
        )}
      </Link>

      {/* perforaciones tipo ticket + divisor punteado */}
      <div className="relative">
        <span className="absolute -left-2 top-1/2 h-4 w-4 -translate-y-1/2 rounded-full border border-thor-line bg-thor-cream" />
        <span className="absolute -right-2 top-1/2 h-4 w-4 -translate-y-1/2 rounded-full border border-thor-line bg-thor-cream" />
        <div className="border-t border-dashed border-thor-line" />
      </div>

      <div className="p-3.5">
        <Link href={`/producto/${product.slug}`} className="block">
          <h3 className="font-body text-sm font-extrabold text-thor-ink transition-colors hover:text-thor-gold">
            {product.team}
          </h3>
        </Link>
        {(product.presetName || product.presetNumber) && (
          <p className="mt-0.5 text-[11px] text-thor-muted">
            {product.presetName}
            {product.presetName && product.presetNumber ? " · " : ""}
            {product.presetNumber && `#${product.presetNumber}`}
          </p>
        )}

        <div className="mt-2.5 flex items-center justify-between gap-3">
          <span className="font-mono text-base font-bold text-thor-gold tabular-nums">
            ${product.price.toLocaleString("es-AR")}
          </span>
          {!product.inStock ? (
            <span className="rounded-lg border border-thor-line px-3 py-2 font-mono text-xs font-bold uppercase tracking-wider text-thor-muted">
              Sin stock
            </span>
          ) : isCustomizable ? (
            <Link
              href={`/producto/${product.slug}`}
              className="rounded-lg bg-thor-ink px-3.5 py-2 font-mono text-xs font-bold uppercase tracking-wider text-thor-cream transition-colors hover:bg-thor-ink-soft"
            >
              Personalizar
            </Link>
          ) : (
            <AddToCartButton
              item={{
                productId: product.id,
                team: product.team,
                price: product.price,
                imageUrl: product.imageUrl,
                colorCss: product.colorCss,
                presetNumber: product.presetNumber,
                customName: product.presetName,
                customNumber: product.presetNumber,
                patchId: null,
                patchLabel: null,
                patchExtraPrice: 0,
              }}
            />
          )}
        </div>

        {!isCustomizable && (
          <Link
            href="/pedido-personalizado"
            className="mt-3 block font-mono text-[11px] text-thor-muted underline decoration-thor-line underline-offset-4 hover:text-thor-gold"
          >
            ¿Buscás otra versión? Pedido personalizado →
          </Link>
        )}
      </div>
    </article>
  );
}
