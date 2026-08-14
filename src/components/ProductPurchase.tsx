"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import type { Product } from "@/lib/api";
import {
  LOW_STOCK_THRESHOLD,
  PRODUCT_TYPE_LABELS,
  PRODUCT_TYPE_TALLES_CATEGORY,
  typeAllowsCustomization,
} from "@/lib/api";
import { useCart } from "@/lib/cart";
import { useRecentlyViewed } from "@/lib/recentlyViewed";
import { trackPixelEvent } from "@/lib/metaPixel";
import { FavoriteButton } from "./FavoriteButton";

export function ProductPurchase({ product }: { product: Product }) {
  const { add } = useCart();
  const { addView } = useRecentlyViewed();
  const canCustomize = typeAllowsCustomization(product.type);
  const [activeImage, setActiveImage] = useState(0);
  const [size, setSize] = useState("");
  const [name, setName] = useState("");
  const [number, setNumber] = useState("");
  const [patchId, setPatchId] = useState<number | null>(null);
  const [added, setAdded] = useState(false);
  const [shared, setShared] = useState(false);
  const [lightbox, setLightbox] = useState(false);
  const touchStartX = useRef<number | null>(null);

  const imageCount = product.images.length;
  const nextImage = () => setActiveImage((i) => (i + 1) % imageCount);
  const prevImage = () => setActiveImage((i) => (i - 1 + imageCount) % imageCount);

  function handleTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX;
  }
  function handleTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current === null) return;
    const delta = e.changedTouches[0].clientX - touchStartX.current;
    touchStartX.current = null;
    if (delta > 40) prevImage();
    else if (delta < -40) nextImage();
  }

  useEffect(() => {
    if (!lightbox) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setLightbox(false);
      if (e.key === "ArrowLeft") prevImage();
      if (e.key === "ArrowRight") nextImage();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lightbox, imageCount]);

  useEffect(() => {
    addView(product.id);
    trackPixelEvent("ViewContent", {
      content_ids: [String(product.id)],
      content_name: product.team,
      content_type: "product",
      value: product.price,
      currency: "ARS",
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product.id]);

  async function handleShare() {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: product.team, url });
      } catch {
        /* el usuario canceló el diálogo de compartir */
      }
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      setShared(true);
      setTimeout(() => setShared(false), 1500);
    } catch {
      /* si el navegador bloquea el portapapeles, no hacemos nada */
    }
  }

  const selectedPatch = product.patches.find((p) => p.id === patchId) ?? null;
  const finalPrice = product.price + (selectedPatch?.extraPrice ?? 0);
  const currentImage = product.images[activeImage] ?? null;

  function handleAdd() {
    if (!size) return;
    add({
      productId: product.id,
      team: product.team,
      price: product.price,
      imageUrl: product.imageUrl,
      colorCss: product.colorCss,
      presetNumber: product.presetNumber,
      size,
      customName: canCustomize ? product.presetName ?? (name.trim() || null) : null,
      customNumber: canCustomize ? product.presetNumber ?? (number.trim() || null) : null,
      patchId: canCustomize ? selectedPatch?.id ?? null : null,
      patchLabel: canCustomize ? selectedPatch?.label ?? null : null,
      patchExtraPrice: canCustomize ? selectedPatch?.extraPrice ?? 0 : 0,
    });
    trackPixelEvent("AddToCart", {
      content_ids: [String(product.id)],
      content_name: product.team,
      content_type: "product",
      value: finalPrice,
      currency: "ARS",
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 1400);
  }

  return (
    <div className="grid gap-10 md:grid-cols-[1.35fr_1fr]">
      {/* Imagen */}
      <div>
        <div
          className="relative flex items-center justify-center overflow-hidden rounded-2xl border border-thor-line bg-thor-cream-2 p-6"
          onTouchStart={imageCount > 1 ? handleTouchStart : undefined}
          onTouchEnd={imageCount > 1 ? handleTouchEnd : undefined}
        >
          {currentImage ? (
            <button
              type="button"
              onClick={() => setLightbox(true)}
              aria-label="Ampliar imagen"
              className="relative h-[420px] w-full cursor-zoom-in sm:h-[560px]"
            >
              <Image
                src={currentImage}
                alt={product.team}
                fill
                sizes="(max-width: 768px) 100vw, 55vw"
                className="rounded-xl object-contain"
                priority
              />
              <span className="absolute bottom-3 right-3 grid h-9 w-9 place-items-center rounded-full bg-thor-ink/70 text-thor-cream">
                <svg viewBox="0 0 24 24" className="h-4.5 w-4.5" fill="none" stroke="currentColor" strokeWidth={2}>
                  <circle cx="11" cy="11" r="7" />
                  <path d="M21 21l-4.3-4.3" strokeLinecap="round" />
                  <path d="M11 8v6M8 11h6" strokeLinecap="round" />
                </svg>
              </span>
            </button>
          ) : (
            <div
              className="jersey-shape flex h-[420px] w-[380px] items-center justify-center"
              style={{ background: product.colorCss }}
            >
              {product.presetNumber && (
                <span className="font-display text-9xl text-thor-ink/80">{product.presetNumber}</span>
              )}
            </div>
          )}
          {imageCount > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  prevImage();
                }}
                aria-label="Foto anterior"
                className="absolute left-2 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full bg-thor-cream/90 text-thor-ink shadow-md hover:bg-thor-cream"
              >
                ‹
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  nextImage();
                }}
                aria-label="Foto siguiente"
                className="absolute right-2 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full bg-thor-cream/90 text-thor-ink shadow-md hover:bg-thor-cream"
              >
                ›
              </button>
            </>
          )}
        </div>
        {product.images.length > 1 && (
          <div className="mt-3 flex gap-2">
            {product.images.map((url, i) => (
              <button
                key={url}
                type="button"
                onClick={() => setActiveImage(i)}
                className={`relative h-16 w-16 overflow-hidden rounded-lg border-2 ${
                  i === activeImage ? "border-thor-gold" : "border-thor-line"
                }`}
                aria-label={`Ver foto ${i + 1}`}
              >
                <Image src={url} alt="" fill sizes="64px" className="object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex flex-col">
        <div className="flex items-center justify-between gap-3">
          <span className="w-fit rounded-md border border-thor-line bg-thor-paper px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-thor-ink-soft">
            {PRODUCT_TYPE_LABELS[product.type]}
          </span>
          <FavoriteButton productId={product.id} className="h-9 w-9" />
        </div>

        <h1 className="mt-3 font-display text-3xl leading-tight tracking-wide text-thor-ink sm:text-4xl">
          {product.team}
        </h1>

        {product.inStock && product.stock <= LOW_STOCK_THRESHOLD && (
          <p className="mt-2 w-fit rounded-md border border-red-600/30 bg-red-50 px-2 py-1 font-mono text-xs font-bold uppercase tracking-wider text-red-600">
            {product.stock === 1 ? "¡Última unidad!" : `¡Quedan ${product.stock} unidades!`}
          </p>
        )}

        <div className="mt-4 rounded-xl border border-thor-line bg-thor-paper px-4 py-3">
          <p className="font-display text-2xl text-thor-gold">${finalPrice.toLocaleString("es-AR")}</p>
          <p className="mt-1.5 text-sm leading-snug text-thor-ink-soft">{product.description}</p>
        </div>

        {/* Talle */}
        <div className="mt-5">
          <span className="mb-1 flex items-center justify-between font-mono text-[11px] uppercase tracking-wide text-thor-muted">
            Talle
            <Link
              href={`/talles?cat=${PRODUCT_TYPE_TALLES_CATEGORY[product.type]}`}
              className="normal-case tracking-normal text-thor-gold underline"
            >
              Ver guía de talles
            </Link>
          </span>
          <div className="flex flex-wrap gap-2">
            {product.sizes.map((s) => {
              const sizeOutOfStock = (product.sizeStock[s] ?? 0) <= 0;
              return (
              <button
                key={s}
                type="button"
                disabled={sizeOutOfStock}
                onClick={() => setSize(s)}
                title={sizeOutOfStock ? "Sin stock en este talle" : undefined}
                className={`rounded-lg border px-3.5 py-2 font-mono text-xs font-bold uppercase tracking-wider transition-colors ${
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
        </div>

        {/* Nombre */}
        {canCustomize && (
        <div className="mt-5">
          <span className="mb-1 block font-mono text-[11px] uppercase tracking-wide text-thor-muted">
            Nombre
          </span>
          {product.presetName ? (
            <p className="rounded-lg border border-thor-line bg-thor-cream-2 px-3 py-2 text-sm text-thor-ink">
              {product.presetName}
            </p>
          ) : (
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nombre en la espalda (opcional)"
              className="w-full rounded-lg border border-thor-line bg-thor-paper px-3 py-2 text-thor-ink"
            />
          )}
        </div>
        )}

        {/* Número */}
        {canCustomize && (
        <div className="mt-3">
          <span className="mb-1 block font-mono text-[11px] uppercase tracking-wide text-thor-muted">
            Número
          </span>
          {product.presetNumber ? (
            <p className="rounded-lg border border-thor-line bg-thor-cream-2 px-3 py-2 text-sm text-thor-ink">
              {product.presetNumber}
            </p>
          ) : (
            <input
              type="number"
              min={0}
              max={99}
              value={number}
              onChange={(e) => setNumber(e.target.value)}
              placeholder="Número (opcional)"
              className="w-full rounded-lg border border-thor-line bg-thor-paper px-3 py-2 text-thor-ink"
            />
          )}
        </div>
        )}

        {/* Parche */}
        {canCustomize && product.patches.length > 0 && (
          <div className="mt-3">
            <span className="mb-1 block font-mono text-[11px] uppercase tracking-wide text-thor-muted">
              Parche
            </span>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setPatchId(null)}
                className={`rounded-lg border px-3 py-2 font-mono text-xs font-bold uppercase tracking-wider transition-colors ${
                  patchId === null
                    ? "border-thor-gold bg-thor-gold/15 text-thor-ink"
                    : "border-thor-line text-thor-muted hover:text-thor-ink"
                }`}
              >
                Sin parche
              </button>
              {product.patches.map((patch) => (
                <button
                  key={patch.id}
                  type="button"
                  onClick={() => setPatchId(patch.id)}
                  className={`flex items-center gap-2 rounded-lg border px-2 py-1.5 font-mono text-xs font-bold transition-colors ${
                    patchId === patch.id
                      ? "border-thor-gold bg-thor-gold/15 text-thor-ink"
                      : "border-thor-line text-thor-muted hover:text-thor-ink"
                  }`}
                >
                  <Image
                    src={patch.imageUrl}
                    alt=""
                    width={28}
                    height={28}
                    className="rounded object-cover"
                  />
                  <span>
                    {patch.label}
                    {patch.extraPrice > 0 && ` +$${patch.extraPrice.toLocaleString("es-AR")}`}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="mt-6 flex flex-wrap items-center gap-3">
          {product.inStock ? (
            <button
              type="button"
              onClick={handleAdd}
              disabled={!size}
              className="rounded-lg bg-thor-ink px-5 py-2.5 font-mono text-xs font-bold uppercase tracking-wider text-thor-cream transition-colors hover:bg-thor-ink-soft disabled:opacity-50"
            >
              {added ? "✓ Agregado" : "Agregar al carrito"}
            </button>
          ) : (
            <span className="rounded-lg border border-thor-line px-4 py-2.5 font-mono text-xs font-bold uppercase tracking-wider text-thor-muted">
              Sin stock
            </span>
          )}
          <button
            type="button"
            onClick={handleShare}
            className="font-mono text-xs text-thor-muted underline decoration-thor-line underline-offset-4 hover:text-thor-gold"
          >
            {shared ? "✓ Link copiado" : "Compartir ↗"}
          </button>
        </div>
        {product.inStock && !size && (
          <p className="mt-2 text-xs text-thor-muted">Elegí un talle para poder agregarlo al carrito.</p>
        )}

        <div className="mt-8 rounded-2xl border border-dashed border-thor-line bg-thor-cream-2 p-5">
          <p className="text-sm text-thor-ink-soft">¿Buscás otra versión o un pedido especial?</p>
          <Link
            href="/pedido-personalizado"
            className="mt-3 inline-block rounded-lg bg-thor-ink px-4 py-2 font-mono text-xs font-bold uppercase tracking-wider text-thor-cream hover:bg-thor-ink-soft"
          >
            Pedila personalizada →
          </Link>
        </div>
      </div>

      {lightbox && currentImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
          onClick={() => setLightbox(false)}
        >
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setLightbox(false);
            }}
            aria-label="Cerrar"
            className="absolute right-4 top-4 grid h-10 w-10 place-items-center rounded-full bg-white/10 text-xl text-white hover:bg-white/20"
          >
            ✕
          </button>
          {imageCount > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  prevImage();
                }}
                aria-label="Foto anterior"
                className="absolute left-2 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-2xl text-white hover:bg-white/20 sm:left-4"
              >
                ‹
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  nextImage();
                }}
                aria-label="Foto siguiente"
                className="absolute right-2 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-2xl text-white hover:bg-white/20 sm:right-4"
              >
                ›
              </button>
            </>
          )}
          <div
            className="relative h-[80vh] w-full max-w-3xl"
            onClick={(e) => e.stopPropagation()}
            onTouchStart={imageCount > 1 ? handleTouchStart : undefined}
            onTouchEnd={imageCount > 1 ? handleTouchEnd : undefined}
          >
            <Image src={currentImage} alt={product.team} fill sizes="100vw" className="object-contain" />
          </div>
        </div>
      )}
    </div>
  );
}
