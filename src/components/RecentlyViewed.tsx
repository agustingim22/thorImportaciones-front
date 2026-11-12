"use client";

import { useEffect, useState } from "react";
import { useRecentlyViewed } from "@/lib/recentlyViewed";
import { ProductCard } from "@/components/ProductCard";
import { toCardProduct, type Product } from "@/lib/api";

export function RecentlyViewed({ excludeId }: { excludeId?: number }) {
  const { ids } = useRecentlyViewed();
  const [products, setProducts] = useState<Product[] | null>(null);

  const idsKey = ids.join(",");

  useEffect(() => {
    if (!idsKey) {
      setProducts([]);
      return;
    }
    // Se piden solo los productos vistos (?ids=): sin eso la API devuelve apenas la primera página del catálogo,
    // y lo que el cliente vio y no está entre esos 24 nunca aparecía.
    fetch(`/api/products?ids=${idsKey}`)
      .then((res) => res.json())
      .then((found: Product[]) => setProducts(found))
      .catch(() => setProducts([]));
  }, [idsKey]);

  if (!products) return null;

  const visible = ids
    .filter((id) => id !== excludeId)
    .map((id) => products.find((p) => p.id === id))
    .filter((p): p is Product => !!p)
    .slice(0, 6);

  if (visible.length === 0) return null;

  return (
    <section className="mx-auto max-w-6xl px-5 py-12">
      <h2 className="font-display text-2xl tracking-wide text-thor-ink sm:text-3xl">
        Vistos recientemente
      </h2>
      <div className="mt-6 flex gap-4 overflow-x-auto pb-2">
        {visible.map((p) => (
          <div key={p.id} className="w-56 shrink-0">
            <ProductCard product={toCardProduct(p)} />
          </div>
        ))}
      </div>
    </section>
  );
}
