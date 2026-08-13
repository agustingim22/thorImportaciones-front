"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Logo } from "./Logo";
import { useCart } from "@/lib/cart";
import { useAuth } from "@/lib/auth";
import { useFavorites } from "@/lib/favorites";
import type { Product } from "@/lib/api";

const LINKS = [
  { href: "/", label: "Inicio" },
  { href: "/camisetas", label: "Camisetas" },
  { href: "/talles", label: "Guía de talles" },
  { href: "/preguntas-frecuentes", label: "Preguntas frecuentes" },
  { href: "/contacto", label: "Contacto" },
];

export function Nav() {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [q, setQ] = useState("");
  const [suggestions, setSuggestions] = useState<Product[]>([]);
  const { count } = useCart();
  const { user } = useAuth();
  const { ids: favoriteIds } = useFavorites();

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  useEffect(() => {
    const query = q.trim();
    if (query.length < 2) {
      setSuggestions([]);
      return;
    }
    const timer = setTimeout(() => {
      fetch(`/api/products?q=${encodeURIComponent(query)}`)
        .then((res) => res.json())
        .then((all: Product[]) => setSuggestions(all.slice(0, 6)))
        .catch(() => setSuggestions([]));
    }, 250);
    return () => clearTimeout(timer);
  }, [q]);

  function closeSearch() {
    setQ("");
    setSuggestions([]);
    setSearchOpen(false);
    setOpen(false);
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const query = q.trim();
    router.push(query ? `/camisetas?q=${encodeURIComponent(query)}` : "/camisetas");
    closeSearch();
  }

  return (
    <header className="sticky top-0 z-50 border-b border-thor-line bg-thor-cream/85 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-3">
        <Link href="/" aria-label="Thor Importaciones — inicio">
          <Logo />
        </Link>

        {/* Links desktop */}
        <nav className="hidden items-center gap-7 lg:flex">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`font-mono text-xs font-semibold uppercase tracking-wider transition-colors ${
                isActive(l.href)
                  ? "text-thor-gold"
                  : "text-thor-muted hover:text-thor-ink"
              }`}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => (searchOpen ? closeSearch() : setSearchOpen(true))}
            aria-label="Buscar camisetas"
            aria-expanded={searchOpen}
            className="grid h-10 w-10 place-items-center rounded-lg border border-thor-line text-thor-ink transition-colors hover:border-thor-gold"
          >
            <span aria-hidden className="text-base leading-none">🔍</span>
          </button>
          <Link
            href="/favoritos"
            aria-label="Mis favoritos"
            className="relative grid h-10 w-10 place-items-center rounded-lg border border-thor-line text-thor-ink transition-colors hover:border-thor-gold"
          >
            <span aria-hidden className="text-lg leading-none">♡</span>
            {favoriteIds.length > 0 && (
              <span className="absolute -right-1.5 -top-1.5 grid h-5 min-w-5 place-items-center rounded-full bg-thor-gold px-1 font-mono text-[10px] font-bold text-thor-ink">
                {favoriteIds.length}
              </span>
            )}
          </Link>
          <Link
            href="/pedido-personalizado"
            className="hidden rounded-lg border border-thor-line px-4 py-2 font-mono text-xs font-bold uppercase tracking-wider text-thor-ink transition-colors hover:border-thor-gold hover:bg-thor-gold/10 sm:inline-block"
          >
            Pedido personalizado
          </Link>
          <Link
            href="/cuenta"
            aria-label="Mi cuenta"
            className="hidden items-center gap-1.5 rounded-lg border border-thor-line px-3 py-2 font-mono text-xs font-bold uppercase tracking-wider text-thor-ink transition-colors hover:border-thor-gold sm:flex"
          >
            <span aria-hidden>👤</span>
            {user ? user.name.split(" ")[0] : "Ingresar"}
          </Link>
          <Link
            href="/carrito"
            aria-label="Ver carrito"
            className="relative grid h-10 w-10 place-items-center rounded-lg border border-thor-line text-thor-ink transition-colors hover:border-thor-gold"
          >
            <span aria-hidden className="text-lg leading-none">🛒</span>
            {count > 0 && (
              <span className="absolute -right-1.5 -top-1.5 grid h-5 min-w-5 place-items-center rounded-full bg-thor-gold px-1 font-mono text-[10px] font-bold text-thor-ink">
                {count}
              </span>
            )}
          </Link>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-label="Abrir menú"
            aria-expanded={open}
            className="grid h-10 w-10 place-items-center rounded-lg border border-thor-line text-thor-ink lg:hidden"
          >
            <span className="text-lg leading-none">{open ? "✕" : "☰"}</span>
          </button>
        </div>
      </div>

      {/* Buscador */}
      {searchOpen && (
        <div className="border-t border-thor-line bg-thor-cream px-5 py-4">
          <div className="relative mx-auto max-w-6xl">
            <form onSubmit={handleSearch} className="flex items-center gap-2">
              <input
                autoFocus
                type="search"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Buscar equipo…"
                className="w-full rounded-lg border border-thor-line bg-thor-paper px-3 py-2 text-sm text-thor-ink"
              />
              <button
                type="submit"
                className="rounded-lg bg-thor-ink px-4 py-2 font-mono text-xs font-bold uppercase tracking-wider text-thor-cream"
              >
                Buscar
              </button>
            </form>

            {suggestions.length > 0 && (
              <div className="absolute left-0 right-0 top-full z-10 mt-2 overflow-hidden rounded-xl border border-thor-line bg-thor-paper shadow-lg">
                {suggestions.map((p) => (
                  <Link
                    key={p.id}
                    href={`/producto/${p.slug}`}
                    onClick={closeSearch}
                    className="flex items-center gap-3 px-3 py-2.5 transition-colors hover:bg-thor-cream-2"
                  >
                    <span className="relative h-9 w-9 shrink-0 overflow-hidden rounded-md bg-thor-cream-2">
                      {p.imageUrl && (
                        <Image src={p.imageUrl} alt="" fill sizes="36px" className="object-cover" />
                      )}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm text-thor-ink">{p.team}</span>
                    </span>
                    <span className="shrink-0 font-mono text-xs text-thor-gold tabular-nums">
                      ${p.price.toLocaleString("es-AR")}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Menú mobile */}
      {open && (
        <nav className="border-t border-thor-line bg-thor-cream px-5 py-4 lg:hidden">
          <ul className="flex flex-col gap-1">
            {LINKS.map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className={`block rounded-lg px-3 py-2.5 font-mono text-sm font-semibold uppercase tracking-wider ${
                    isActive(l.href)
                      ? "bg-thor-gold/10 text-thor-gold"
                      : "text-thor-ink hover:bg-thor-cream-2"
                  }`}
                >
                  {l.label}
                </Link>
              </li>
            ))}
            <li>
              <Link
                href="/cuenta"
                onClick={() => setOpen(false)}
                className="block rounded-lg px-3 py-2.5 font-mono text-sm font-semibold uppercase tracking-wider text-thor-ink hover:bg-thor-cream-2"
              >
                👤 {user ? user.name.split(" ")[0] : "Mi cuenta"}
              </Link>
            </li>
            <li>
              <Link
                href="/favoritos"
                onClick={() => setOpen(false)}
                className="block rounded-lg px-3 py-2.5 font-mono text-sm font-semibold uppercase tracking-wider text-thor-ink hover:bg-thor-cream-2"
              >
                ♡ Mis favoritos{favoriteIds.length > 0 && ` (${favoriteIds.length})`}
              </Link>
            </li>
            <li className="mt-2">
              <Link
                href="/pedido-personalizado"
                onClick={() => setOpen(false)}
                className="block rounded-lg bg-thor-gold px-3 py-2.5 text-center font-mono text-sm font-bold uppercase tracking-wider text-thor-ink"
              >
                Pedido personalizado
              </Link>
            </li>
          </ul>
        </nav>
      )}
    </header>
  );
}
