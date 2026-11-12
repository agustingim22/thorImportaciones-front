"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { CLUB_GROUPS, MENU_CLUBS } from "@/lib/clubs";

/** Menú desplegable de equipos (clubes y selecciones) para el Nav de escritorio. Se abre con
 *  clic (sirve también en touch), se cierra con clic afuera, Escape o al elegir un equipo. */
export function ClubsMenu() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="true"
        onClick={() => setOpen((v) => !v)}
        className={`whitespace-nowrap font-mono text-xs font-semibold uppercase tracking-wider transition-colors ${
          open ? "text-thor-gold" : "text-thor-muted hover:text-thor-ink"
        }`}
      >
        Equipos <span aria-hidden>▾</span>
      </button>

      {open && (
        <div className="absolute left-0 top-full z-50 mt-4 w-[34rem] rounded-xl border border-thor-line bg-thor-paper p-4 shadow-lg">
          {CLUB_GROUPS.map((g, i) => (
            <div key={g.key} className={i > 0 ? "mt-3 border-t border-thor-line pt-3" : ""}>
              <p className="mb-2 font-mono text-[10px] font-bold uppercase tracking-widest text-thor-muted">
                {g.label}
              </p>
              <ul className="grid grid-cols-3 gap-x-4 gap-y-0.5">
                {MENU_CLUBS.filter((c) => c.group === g.key).map((c) => (
                  <li key={c.slug}>
                    <Link
                      href={`/catalogo?club=${c.slug}`}
                      onClick={() => setOpen(false)}
                      className="block rounded-md px-2 py-1.5 text-sm text-thor-ink transition-colors hover:bg-thor-cream-2 hover:text-thor-gold"
                    >
                      {c.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          <Link
            href="/equipos"
            onClick={() => setOpen(false)}
            className="mt-3 block border-t border-thor-line pt-3 font-mono text-xs font-bold uppercase tracking-wider text-thor-gold hover:underline"
          >
            Ver todos los equipos →
          </Link>
        </div>
      )}
    </div>
  );
}
