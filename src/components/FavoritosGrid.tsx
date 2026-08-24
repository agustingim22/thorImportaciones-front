"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useFavorites } from "@/lib/favorites";
import { ProductCard } from "@/components/ProductCard";
import type { Product } from "@/lib/api";

export function FavoritosGrid() {
  const { ids } = useFavorites();
  const [products, setProducts] = useState<Product[] | null>(null);

  useEffect(() => {
    fetch("/api/products")
      .then((res) => res.json())
      .then((all: Product[]) => setProducts(all))
      .catch(() => setProducts([]));
  }, []);

  if (products === null) {
    return <p className="px-5 py-16 text-center text-thor-muted">Cargando…</p>;
  }

  const favorites = products.filter((p) => ids.includes(p.id));

  if (favorites.length === 0) {
    return (
      <div className="mx-auto max-w-lg px-5 py-20 text-center">
        <div className="text-4xl">♡</div>
        <h1 className="mt-4 font-display text-3xl tracking-wide text-thor-ink">
          Todavía no tenés favoritos
        </h1>
        <p className="mt-3 text-thor-muted">
          Tocá el corazón en cualquier camiseta del catálogo para guardarla acá.
        </p>
        <Link
          href="/catalogo"
          className="mt-8 inline-block rounded-xl bg-thor-gold px-6 py-3 font-mono text-sm font-bold uppercase tracking-wider text-thor-ink"
        >
          Ver catálogo
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-5 py-12">
      <h1 className="font-display text-4xl tracking-wide text-thor-ink">Mis favoritos</h1>
      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {favorites.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </div>
  );
}
