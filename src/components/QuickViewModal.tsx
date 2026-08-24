"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import type { Product } from "@/lib/api";
import { effectivePrice, typeAllowsCustomization } from "@/lib/api";
import { useCart } from "@/lib/cart";
import { trackPixelEvent } from "@/lib/metaPixel";
import { pushEcommerceEvent } from "@/lib/dataLayer";

export function QuickViewModal({ product, onClose }: { product: Product; onClose: () => void }) {
  const { add } = useCart();
  const canCustomize = typeAllowsCustomization(product.type);
  const isCustomizable =
    canCustomize && (!product.presetName || !product.presetNumber || product.patches.length > 0);
  const onSale = product.salePrice != null && product.salePrice < product.price;
  const [size, setSize] = useState("");
  const [added, setAdded] = useState(false);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  function handleAdd() {
    if (!size) return;
    add({
      productId: product.id,
      team: product.team,
      price: effectivePrice(product),
      imageUrl: product.imageUrl,
      colorCss: product.colorCss,
      presetNumber: product.presetNumber,
      size,
      customName: canCustomize ? product.presetName : null,
      customNumber: canCustomize ? product.presetNumber : null,
      patchId: null,
      patchLabel: null,
      patchExtraPrice: 0,
    });
    trackPixelEvent("AddToCart", {
      content_ids: [String(product.id)],
      content_name: product.team,
      content_type: "product",
      value: effectivePrice(product),
      currency: "ARS",
    });
    pushEcommerceEvent("add_to_cart", {
      currency: "ARS",
      value: effectivePrice(product),
      items: [
        { item_id: String(product.id), item_name: product.team, price: effectivePrice(product), quantity: 1 },
      ],
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 1400);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg rounded-2xl border border-thor-line bg-thor-paper p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar"
          className="absolute right-4 top-4 grid h-8 w-8 place-items-center rounded-full border border-thor-line text-thor-ink hover:border-thor-gold"
        >
          ✕
        </button>

        <div className="grid gap-4 sm:grid-cols-[1fr_1.2fr]">
          <div className="relative flex aspect-square items-center justify-center overflow-hidden rounded-xl bg-thor-cream-2">
            {product.imageUrl ? (
              <Image
                src={product.imageUrl}
                alt={product.team}
                fill
                sizes="240px"
                className="object-cover"
              />
            ) : (
              <div
                className="jersey-shape flex h-[64%] w-[56%] items-center justify-center"
                style={{ background: product.colorCss }}
              >
                {product.presetNumber && (
                  <span className="font-display text-5xl text-thor-ink/80">
                    {product.presetNumber}
                  </span>
                )}
              </div>
            )}
          </div>

          <div className="flex flex-col">
            <h2 className="font-display text-xl tracking-wide text-thor-ink">{product.team}</h2>
            <p className="mt-1 flex items-baseline gap-2">
              {onSale && (
                <span className="font-mono text-sm text-thor-muted line-through">
                  ${product.price.toLocaleString("es-AR")}
                </span>
              )}
              <span className="font-mono text-lg font-bold text-thor-gold">
                ${effectivePrice(product).toLocaleString("es-AR")}
              </span>
            </p>
            <p className="mt-2 line-clamp-3 text-sm text-thor-ink-soft">{product.description}</p>

            {!product.inStock ? (
              <p className="mt-4 font-mono text-xs font-bold uppercase tracking-wider text-thor-muted">
                Sin stock
              </p>
            ) : isCustomizable ? (
              <>
                <p className="mt-4 text-xs text-thor-muted">
                  Este producto se personaliza (nombre, número o parche a elección).
                </p>
                <Link
                  href={`/producto/${product.slug}`}
                  className="mt-3 inline-block w-fit rounded-lg bg-thor-ink px-4 py-2 font-mono text-xs font-bold uppercase tracking-wider text-thor-cream hover:bg-thor-ink-soft"
                >
                  Personalizar →
                </Link>
              </>
            ) : (
              <>
                <div className="mt-4 flex flex-wrap gap-2">
                  {product.sizes.map((s) => {
                    const sizeOutOfStock = (product.sizeStock[s] ?? 0) <= 0;
                    return (
                      <button
                        key={s}
                        type="button"
                        disabled={sizeOutOfStock}
                        onClick={() => setSize(s)}
                        className={`rounded-lg border px-3 py-1.5 font-mono text-xs font-bold uppercase tracking-wider transition-colors ${
                          sizeOutOfStock
                            ? "cursor-not-allowed border-thor-line text-thor-muted/40 line-through"
                            : size === s
                              ? "border-thor-gold bg-thor-gold/15 text-thor-ink"
                              : "border-thor-line text-thor-muted hover:text-thor-ink"
                        }`}
                      >
                        {s}
                      </button>
                    );
                  })}
                </div>
                <button
                  type="button"
                  onClick={handleAdd}
                  disabled={!size}
                  className="mt-4 w-fit rounded-lg bg-thor-ink px-4 py-2 font-mono text-xs font-bold uppercase tracking-wider text-thor-cream transition-colors hover:bg-thor-ink-soft disabled:opacity-50"
                >
                  {added ? "✓ Agregado" : "Agregar al carrito"}
                </button>
              </>
            )}

            <Link
              href={`/producto/${product.slug}`}
              className="mt-4 font-mono text-[11px] text-thor-muted underline decoration-thor-line underline-offset-4 hover:text-thor-gold"
            >
              Ver detalle completo →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
