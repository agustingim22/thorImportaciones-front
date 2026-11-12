"use client";

import { useState } from "react";
import { CLUB_GROUPS, FEATURED_CLUBS } from "@/lib/clubs";
import { adminClassifyClubs, type ClubClassifySummary } from "@/lib/admin";

const PRIMARY =
  "rounded-lg bg-thor-gold px-5 py-2.5 font-mono text-xs font-bold uppercase tracking-wider text-thor-ink disabled:opacity-60";
const SECONDARY =
  "rounded-lg border border-thor-line px-5 py-2.5 font-mono text-xs font-bold uppercase tracking-wider text-thor-ink hover:border-thor-gold disabled:opacity-60";

/** Asigna cada producto a un equipo destacado (clubes y selecciones) según su nombre, para que
 *  funcione el menú "Equipos" y el filtro del catálogo. Dos pasos: simulacro y aplicar. */
export function AdminClubs() {
  const [summary, setSummary] = useState<ClubClassifySummary | null>(null);
  const [busy, setBusy] = useState<"simulate" | "apply" | null>(null);
  const [error, setError] = useState("");

  async function run(apply: boolean) {
    setError("");
    setBusy(apply ? "apply" : "simulate");
    try {
      setSummary(await adminClassifyClubs(apply));
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo completar la operación.");
    } finally {
      setBusy(null);
    }
  }

  const applied = summary && !summary.dryRun;
  const canApply = summary && summary.dryRun && summary.pendingChanges > 0;

  return (
    <div className="max-w-3xl rounded-2xl border border-thor-line bg-thor-paper p-6">
      <p className="text-sm text-thor-ink">
        Cada producto se asigna a un equipo (Boca, River, Argentina…) según su nombre. Es lo que
        hace funcionar el menú <strong>Equipos</strong> y el filtro del catálogo.
      </p>
      <p className="mt-2 text-xs text-thor-muted">
        Los productos que cargás desde este panel (a mano o por CSV) se clasifican solos. Usá esto
        para los que ya estaban cargados, o para los que hayas importado por otra vía. Además
        ordena el catálogo (“Destacados”): camisetas de juego primero y un equipo distinto cada
        vez, así que la primera vez “A cambiar” puede ser casi todo el catálogo. Primero mirá el
        simulacro y, si se ve bien, aplicá.
      </p>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <button type="button" onClick={() => run(false)} disabled={busy !== null} className={SECONDARY}>
          {busy === "simulate" ? "Calculando…" : "Ver simulacro"}
        </button>
        {canApply && (
          <button type="button" onClick={() => run(true)} disabled={busy !== null} className={PRIMARY}>
            {busy === "apply" ? "Aplicando…" : `Aplicar a ${summary.pendingChanges} productos`}
          </button>
        )}
      </div>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      {applied && (
        <p className="mt-5 rounded-lg border border-thor-line bg-thor-cream px-4 py-3 text-sm text-thor-ink">
          ✓ Listo: se actualizaron <strong>{summary.updated ?? 0}</strong> productos. El catálogo
          muestra los cambios en 1 o 2 minutos.
        </p>
      )}
      {summary && summary.dryRun && summary.pendingChanges === 0 && (
        <p className="mt-5 rounded-lg border border-thor-line bg-thor-cream px-4 py-3 text-sm text-thor-ink">
          ✓ Todo está al día: no hay productos para cambiar.
        </p>
      )}

      {summary && (
        <div className="mt-6">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat label="Productos" value={summary.total} />
            <Stat label="Con equipo" value={summary.matched} />
            <Stat label="Sin equipo" value={summary.unmatched} />
            {summary.dryRun && <Stat label="A cambiar" value={summary.pendingChanges} />}
          </div>
          <p className="mt-2 text-xs text-thor-muted">
            “Sin equipo” son camisetas de otros equipos y otros productos (NBA, rugby, remeras…):
            quedan como están.
          </p>
          {summary.manual > 0 && (
            <p className="mt-1 text-xs text-thor-muted">
              {summary.manual} producto{summary.manual === 1 ? " tiene" : "s tienen"} el equipo fijado a mano
              desde su ficha: la clasificación no los toca.
            </p>
          )}

          {CLUB_GROUPS.map((g) => (
            <div key={g.key} className="mt-5">
              <p className="mb-2 font-mono text-[11px] uppercase tracking-wide text-thor-muted">{g.label}</p>
              <ul className="flex flex-wrap gap-2">
                {FEATURED_CLUBS.filter((c) => c.group === g.key).map((c) => {
                  const n = summary.byClub[c.slug] ?? 0;
                  return (
                    <li
                      key={c.slug}
                      className={`rounded-full border px-3 py-1 text-sm ${
                        n > 0 ? "border-thor-line text-thor-ink" : "border-dashed border-thor-line text-thor-muted"
                      }`}
                    >
                      {c.name} <span className="ml-1 font-mono text-xs tabular-nums opacity-70">{n}</span>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
          <p className="mt-2 text-xs text-thor-muted">
            Si un equipo grande figura en 0, probablemente falte alguna sigla: avisame cómo aparece en
            el nombre de los productos.
          </p>

          {summary.unmatchedTop.length > 0 && (
            <div className="mt-6">
              <p className="mb-1 font-mono text-[11px] uppercase tracking-wide text-thor-muted">
                Equipos sin clasificar que más se repiten
              </p>
              <p className="mb-2 text-xs text-thor-muted">
                Son los próximos candidatos a sumar al menú: cuantas más camisetas tengan, más conviene.
              </p>
              <ol className="max-h-72 overflow-y-auto rounded-xl border border-thor-line bg-thor-cream text-sm">
                {summary.unmatchedTop.map((t) => (
                  <li
                    key={t.name}
                    className="flex items-baseline gap-3 border-b border-thor-line px-4 py-1.5 last:border-b-0"
                  >
                    <span className="flex-1 truncate text-thor-ink" title={t.example}>
                      {t.name}
                    </span>
                    <span className="font-mono text-xs font-bold tabular-nums text-thor-ink">{t.count}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {summary.unmatchedSample.length > 0 && (
            <details className="mt-5 text-sm text-thor-ink">
              <summary className="cursor-pointer font-mono text-xs font-bold uppercase tracking-wide">
                Muestra de productos sin equipo ({summary.unmatchedSample.length})
              </summary>
              <ul className="mt-2 max-h-64 list-disc overflow-y-auto pl-5 text-xs text-thor-muted">
                {summary.unmatchedSample.map((name, i) => (
                  <li key={i}>{name}</li>
                ))}
              </ul>
            </details>
          )}
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-thor-line bg-thor-cream px-4 py-3">
      <p className="font-mono text-[10px] uppercase tracking-wide text-thor-muted">{label}</p>
      <p className="mt-1 text-xl font-semibold tabular-nums text-thor-ink">{value}</p>
    </div>
  );
}
