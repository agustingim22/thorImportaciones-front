"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { Logo } from "./Logo";
import { useCart } from "@/lib/cart";
import { useAuth } from "@/lib/auth";

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
  const { count } = useCart();
  const { user } = useAuth();

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const query = q.trim();
    router.push(query ? `/camisetas?q=${encodeURIComponent(query)}` : "/camisetas");
    setQ("");
    setSearchOpen(false);
    setOpen(false);
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
            onClick={() => setSearchOpen((v) => !v)}
            aria-label="Buscar camisetas"
            aria-expanded={searchOpen}
            className="grid h-10 w-10 place-items-center rounded-lg border border-thor-line text-thor-ink transition-colors hover:border-thor-gold"
          >
            <span aria-hidden className="text-base leading-none">🔍</span>
          </button>
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
          <form onSubmit={handleSearch} className="mx-auto flex max-w-6xl items-center gap-2">
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
