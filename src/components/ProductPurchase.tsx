"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import type { Product } from "@/lib/api";
import { LOW_STOCK_THRESHOLD, PRODUCT_TYPE_LABELS } from "@/lib/api";
import { useCart } from "@/lib/cart";

export function ProductPurchase({ product }: { product: Product }) {
  const { add } = useCart();
  const [activeImage, setActiveImage] = useState(0);
  const [size, setSize] = useState("");
  const [name, setName] = useState("");
  const [number, setNumber] = useState("");
  const [patchId, setPatchId] = useState<number | null>(null);
  const [added, setAdded] = useState(false);
  const [shared, setShared] = useState(false);

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
      customName: product.presetName ?? (name.trim() || null),
      customNumber: product.presetNumber ?? (number.trim() || null),
      patchId: selectedPatch?.id ?? null,
      patchLabel: selectedPatch?.label ?? null,
      patchExtraPrice: selectedPatch?.extraPrice ?? 0,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 1400);
  }

  return (
    <div className="grid gap-10 md:grid-cols-[1.35fr_1fr]">
      {/* Imagen */}
      <div>
        <div className="flex items-center justify-center overflow-hidden rounded-2xl border border-thor-line bg-thor-cream-2 p-6">
          {currentImage ? (
            <div className="relative h-[420px] w-full sm:h-[560px]">
              <Image
                src={currentImage}
                alt={product.team}
                fill
                sizes="(max-width: 768px) 100vw, 55vw"
                className="rounded-xl object-contain"
                priority
              />
            </div>
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
        <span className="w-fit rounded-md border border-thor-line bg-thor-paper px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-thor-ink-soft">
          {PRODUCT_TYPE_LABELS[product.type]}
        </span>

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
            <Link href="/talles" className="normal-case tracking-normal text-thor-gold underline">
              Ver guía de talles
            </Link>
          </span>
          <div className="flex flex-wrap gap-2">
            {product.sizes.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSize(s)}
                className={`rounded-lg border px-3.5 py-2 font-mono text-xs font-bold uppercase tracking-wider transition-colors ${
                  size === s
                    ? "border-thor-gold bg-thor-gold/15 text-thor-ink"
                    : "border-thor-line text-thor-muted hover:text-thor-ink"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Nombre */}
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

        {/* Número */}
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

        {/* Parche */}
        {product.patches.length > 0 && (
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
    </div>
  );
}
