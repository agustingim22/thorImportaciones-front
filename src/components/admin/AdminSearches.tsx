"use client";

import { useEffect, useState } from "react";
import { adminDeleteSearch, adminGetSearches, type AdminSearchTerm, type AdminSearches } from "@/lib/admin";

function ago(iso: string): string {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (days <= 0) return "hoy";
  if (days === 1) return "ayer";
  return `hace ${days} días`;
}

/** Lo que buscan los clientes en la tienda. Lo más útil es lo que NO encuentran: son equipos o productos que
 *  se están pidiendo y que no tenés cargados (o que están escritos distinto). */
export function AdminSearches() {
  const [data, setData] = useState<AdminSearches | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    adminGetSearches()
      .then(setData)
      .catch((err) => setError(err instanceof Error ? err.message : "No se pudieron cargar las búsquedas."));
  }, []);

  async function discard(id: number) {
    try {
      await adminDeleteSearch(id);
      setData((d) => (d ? { ...d, zero: d.zero.filter((t) => t.id !== id), top: d.top.filter((t) => t.id !== id) } : d));
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo descartar.");
    }
  }

  if (error && !data) return <p className="text-sm text-red-600">{error}</p>;
  if (!data) return <p className="text-sm text-thor-muted">Cargando…</p>;

  return (
    <div className="max-w-3xl rounded-2xl border border-thor-line bg-thor-paper p-6">
      <p className="text-sm text-thor-ink">
        Lo que escriben los clientes en el buscador del catálogo. No se guarda quién buscó, solo el texto.
      </p>
      <p className="mt-2 text-xs text-thor-muted">
        {data.totalSearches.toLocaleString("es-AR")} búsquedas · {data.distinctTerms.toLocaleString("es-AR")} textos
        distintos. Las que se hicieron una sola vez hace más de 60 días se borran solas.
      </p>
      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

      <Section
        title="Buscaron y no encontraron nada"
        hint="Si ves un equipo repetido, conviene cargarlo. Cuando lo resuelvas, descartalo de la lista."
        empty="Todavía no hay búsquedas sin resultados."
        rows={data.zero}
        onDiscard={discard}
      />
      <Section
        title="Lo más buscado"
        hint="Lo que sí encuentran: sirve para saber qué destacar."
        empty="Todavía no hay búsquedas."
        rows={data.top}
        onDiscard={discard}
      />
    </div>
  );
}

function Section({
  title,
  hint,
  empty,
  rows,
  onDiscard,
}: {
  title: string;
  hint: string;
  empty: string;
  rows: AdminSearchTerm[];
  onDiscard: (id: number) => void;
}) {
  return (
    <div className="mt-6">
      <h3 className="font-mono text-xs font-bold uppercase tracking-wide text-thor-ink">{title}</h3>
      <p className="mt-1 text-xs text-thor-muted">{hint}</p>
      {rows.length === 0 ? (
        <p className="mt-3 text-sm text-thor-muted">{empty}</p>
      ) : (
        <ul className="mt-3 divide-y divide-thor-line rounded-xl border border-thor-line bg-thor-cream">
          {rows.map((r) => (
            <li key={r.id} className="flex items-center gap-3 px-4 py-2 text-sm">
              <span className="min-w-0 flex-1 truncate text-thor-ink">{r.term}</span>
              {r.results > 0 && <span className="text-xs text-thor-muted">{r.results} resultados</span>}
              <span className="text-xs text-thor-muted">{ago(r.lastAt)}</span>
              <span className="w-12 text-right font-mono text-xs font-bold tabular-nums text-thor-ink">
                {r.searches}×
              </span>
              <button
                type="button"
                onClick={() => onDiscard(r.id)}
                className="font-mono text-xs text-thor-muted underline hover:text-red-600"
                aria-label={`Descartar "${r.term}"`}
              >
                Descartar
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
