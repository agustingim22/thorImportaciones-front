import Link from "next/link";
import Image from "next/image";
import type { Product } from "@/lib/api";
import { isNewProduct, LOW_STOCK_THRESHOLD, PRODUCT_TYPE_LABELS, typeAllowsCustomization } from "@/lib/api";
import { FavoriteButton } from "./FavoriteButton";

export function ProductCard({ product }: { product: Product }) {
  // Si el comprador tiene algo para elegir (nombre, número o parche), lo mandamos
  // al detalle a personalizar en vez de agregarlo directo desde la card.
  // Las prendas que no son camisetas (remeras, conjuntos, pantalones) nunca se personalizan.
  const canCustomize = typeAllowsCustomization(product.type);
  const isCustomizable =
    canCustomize && (!product.presetName || !product.presetNumber || product.patches.length > 0);
  const lowStock = product.inStock && product.stock <= LOW_STOCK_THRESHOLD;
  const isNew = isNewProduct(product.createdAt);

  return (
    <article className="group relative overflow-hidden rounded-2xl border border-thor-line bg-thor-paper transition-transform duration-200 hover:-translate-y-1">
      {/* etiqueta tipo boarding pass */}
      <span className="absolute left-3 top-3 z-10 rounded-md border border-thor-line bg-thor-cream/80 px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-thor-ink-soft">
        {PRODUCT_TYPE_LABELS[product.type]}
      </span>
      {lowStock ? (
        <span className="absolute right-3 top-3 z-10 rounded-md border border-red-600/30 bg-red-50 px-2 py-1 font-mono text-[10px] font-bold uppercase tracking-wider text-red-600">
          {product.stock === 1 ? "¡Última unidad!" : `¡Últimas ${product.stock}!`}
        </span>
      ) : isNew ? (
        <span className="absolute right-3 top-3 z-10 rounded-md border border-thor-sky/30 bg-thor-sky/15 px-2 py-1 font-mono text-[10px] font-bold uppercase tracking-wider text-thor-sky">
          Nuevo
        </span>
      ) : null}
      <FavoriteButton
        productId={product.id}
        className="absolute bottom-3 right-3 z-10 h-8 w-8 shadow-sm"
      />

      {/* imagen (link al detalle) — tamaño fijo (1:1) para que todas las cards queden simétricas */}
      <Link
        href={`/producto/${product.slug}`}
        className="relative flex aspect-square items-center justify-center overflow-hidden bg-thor-cream-2"
      >
        {product.imageUrl ? (
          <Image
            src={product.imageUrl}
            alt={product.team}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover"
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
          ) : (
            <Link
              href={`/producto/${product.slug}`}
              className="rounded-lg bg-thor-ink px-3.5 py-2 font-mono text-xs font-bold uppercase tracking-wider text-thor-cream transition-colors hover:bg-thor-ink-soft"
            >
              {isCustomizable ? "Personalizar" : "Elegir talle"}
            </Link>
          )}
        </div>

        {canCustomize && !isCustomizable && (
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
