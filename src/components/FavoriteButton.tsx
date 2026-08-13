"use client";

import { useFavorites } from "@/lib/favorites";

export function FavoriteButton({
  productId,
  className = "",
}: {
  productId: number;
  className?: string;
}) {
  const { isFavorite, toggle } = useFavorites();
  const active = isFavorite(productId);

  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggle(productId);
      }}
      aria-label={active ? "Quitar de favoritos" : "Agregar a favoritos"}
      aria-pressed={active}
      className={`grid place-items-center rounded-full border transition-colors ${
        active
          ? "border-red-500/40 bg-red-50 text-red-500"
          : "border-thor-line bg-thor-cream/80 text-thor-ink-soft hover:text-red-500"
      } ${className}`}
    >
      <span aria-hidden className="text-base leading-none">
        {active ? "♥" : "♡"}
      </span>
    </button>
  );
}
