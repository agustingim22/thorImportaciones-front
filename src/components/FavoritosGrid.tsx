"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useFavorites } from "@/lib/favorites";
import { useAuth } from "@/lib/auth";
import { registerFavoritesWatch } from "@/lib/stockNotify";
import { ProductCard } from "@/components/ProductCard";
import type { Product } from "@/lib/api";

const WATCH_EMAIL_KEY = "thor-favorite-watch-email";

/** Pide (una sola vez) el email para avisar si algún favorito se queda sin stock.
 *  Si ya está logueado o ya lo pidió antes, se registra solo, sin molestar. */
function FavoriteWatchBanner({ productIds }: { productIds: number[] }) {
  const { user } = useAuth();
  const [savedEmail, setSavedEmail] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    try {
      setSavedEmail(localStorage.getItem(WATCH_EMAIL_KEY));
    } catch {
      /* sin acceso a localStorage */
    }
    setChecked(true);
  }, []);

  const activeEmail = user?.email ?? savedEmail;
  const idsKey = productIds.join(",");

  useEffect(() => {
    if (!activeEmail || productIds.length === 0) return;
    registerFavoritesWatch(activeEmail, productIds).catch(() => {});
    // idsKey representa el mismo contenido que productIds de forma estable entre renders
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeEmail, idsKey]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await registerFavoritesWatch(email, productIds);
      try {
        localStorage.setItem(WATCH_EMAIL_KEY, email);
      } catch {
        /* no crítico */
      }
      setDone(true);
    } catch {
      /* si falla, simplemente no se registró — no bloqueamos la página por esto */
    } finally {
      setLoading(false);
    }
  }

  if (!checked || activeEmail || dismissed) return null;

  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-thor-line bg-thor-cream-2 px-4 py-3">
      {done ? (
        <p className="text-sm text-thor-ink">✓ Listo, te avisamos si alguno se queda sin stock.</p>
      ) : (
        <>
          <p className="text-sm text-thor-ink-soft">
            ¿Te avisamos por mail si alguno de tus favoritos se queda sin stock?
          </p>
          <form onSubmit={handleSubmit} className="flex gap-2">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@email.com"
              className="w-48 rounded-lg border border-thor-line bg-thor-paper px-3 py-1.5 text-sm text-thor-ink"
            />
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-thor-ink px-3 py-1.5 font-mono text-xs font-bold uppercase tracking-wider text-thor-cream disabled:opacity-60"
            >
              {loading ? "..." : "Avisame"}
            </button>
            <button
              type="button"
              onClick={() => setDismissed(true)}
              aria-label="No, gracias"
              className="rounded-lg px-2 text-thor-muted hover:text-thor-ink"
            >
              ✕
            </button>
          </form>
        </>
      )}
    </div>
  );
}

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
      <div className="mt-6">
        <FavoriteWatchBanner productIds={favorites.map((p) => p.id)} />
      </div>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {favorites.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </div>
  );
}
