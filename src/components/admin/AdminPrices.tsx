"use client";

import { useEffect, useMemo, useState } from "react";
import { PRODUCT_TYPES, PRODUCT_TYPE_LABELS } from "@/lib/api";
import { FEATURED_CLUBS, getClubBySlug } from "@/lib/clubs";
import { displayName } from "@/lib/displayName";
import { PRICE_LIMITS, ROUNDING_OPTIONS, formatPercent, validatePriceParams, type PricePreview, type PriceUpdateParams } from "@/lib/priceUpdate";
import {
  adminPriceApply,
  adminPriceHistory,
  adminPricePreview,
  adminPriceUndo,
  type AdminPriceHistory,
} from "@/lib/admin";

const INPUT = "w-full rounded-lg border border-thor-line bg-thor-cream px-3 py-2 text-thor-ink";
const LABEL = "mb-1 block font-mono text-[11px] uppercase tracking-wide text-thor-muted";
const BTN =
  "rounded-lg px-5 py-2.5 font-mono text-xs font-bold uppercase tracking-wider disabled:opacity-60";

const money = (n: number) => `$${n.toLocaleString("es-AR")}`;

const CLUBS_SORTED = (group: "club" | "selection") =>
  FEATURED_CLUBS.filter((c) => c.group === group).sort((a, b) => a.name.localeCompare(b.name, "es"));

function scopeText(scope: { types: string[]; club: string }): string {
  const types =
    scope.types.length === PRODUCT_TYPES.length
      ? "todos los tipos"
      : scope.types.length <= 3
        ? scope.types.map((t) => PRODUCT_TYPE_LABELS[t as keyof typeof PRODUCT_TYPE_LABELS] ?? t).join(", ")
        : `${scope.types.length} tipos`;
  const club = scope.club === "" ? "todos los equipos" : scope.club === "none" ? "sin equipo" : (getClubBySlug(scope.club)?.name ?? scope.club);
  return `${types} · ${club}`;
}

/** Sube o baja los precios de muchos productos de una vez, por porcentaje. Siempre hay una vista previa antes de
 *  aplicar, y la última actualización se puede deshacer. */
export function AdminPrices() {
  const [types, setTypes] = useState<string[]>([]);
  const [club, setClub] = useState("");
  const [percent, setPercent] = useState("");
  const [rounding, setRounding] = useState<number>(100);
  const [includeSale, setIncludeSale] = useState(true);

  const [preview, setPreview] = useState<PricePreview | null>(null);
  const [previewing, setPreviewing] = useState(false);
  const [applying, setApplying] = useState(false);
  const [undoing, setUndoing] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [history, setHistory] = useState<AdminPriceHistory>({ history: [], undoableId: null });

  useEffect(() => {
    adminPriceHistory()
      .then(setHistory)
      .catch(() => {});
  }, []);

  const params: Partial<PriceUpdateParams> = useMemo(
    () => ({ percent: percent.trim() === "" ? undefined : Number(percent.replace(",", ".")), rounding, includeSale, types, club }),
    [percent, rounding, includeSale, types, club],
  );

  // Cualquier cambio en el formulario invalida la vista previa: lo que se aplica es siempre lo que se vio.
  function change<T>(setter: (v: T) => void) {
    return (v: T) => {
      setter(v);
      setPreview(null);
      setMessage("");
      setError("");
    };
  }
  const changeTypes = change(setTypes);
  const changeClub = change(setClub);
  const changePercent = change(setPercent);
  const changeRounding = change(setRounding);
  const changeIncludeSale = change(setIncludeSale);

  const toggleType = (t: string) => changeTypes(types.includes(t) ? types.filter((x) => x !== t) : [...types, t]);
  const allTypes = types.length === PRODUCT_TYPES.length;

  async function handlePreview(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setMessage("");
    setPreview(null);
    const invalid = validatePriceParams(params);
    if (invalid) {
      setError(invalid);
      return;
    }
    setPreviewing(true);
    try {
      setPreview(await adminPricePreview(params as PriceUpdateParams));
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo calcular la vista previa.");
    } finally {
      setPreviewing(false);
    }
  }

  async function handleApply() {
    if (!preview || preview.count === 0) return;
    const p = params as PriceUpdateParams;
    if (
      !confirm(
        `Vas a cambiar el precio de ${preview.count.toLocaleString("es-AR")} productos (${formatPercent(p.percent)}).\n\nDespués podés deshacerlo desde el historial. ¿Aplicar?`,
      )
    )
      return;
    setApplying(true);
    setError("");
    try {
      const res = await adminPriceApply(p, preview.expect);
      setHistory({ history: res.history, undoableId: res.undoableId });
      setMessage(
        `✓ Listo: se actualizaron ${res.count.toLocaleString("es-AR")} productos. La tienda los muestra en cuanto alguien entra (como mucho en 1 o 2 minutos). Los carritos que ya estaban armados toman el precio nuevo cuando el cliente vuelve a abrir el sitio.`,
      );
      setPreview(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo aplicar el cambio.");
    } finally {
      setApplying(false);
    }
  }

  async function handleUndo() {
    if (!confirm("Se van a volver los precios a como estaban antes de la última actualización. ¿Deshacer?")) return;
    setUndoing(true);
    setError("");
    setMessage("");
    try {
      const res = await adminPriceUndo();
      setHistory({ history: res.history, undoableId: res.undoableId });
      setPreview(null);
      setMessage(
        `✓ Se restauraron ${res.reverted.toLocaleString("es-AR")} productos.` +
          (res.skipped > 0
            ? ` ${res.skipped.toLocaleString("es-AR")} no se tocaron porque su precio ya se había vuelto a cambiar a mano.`
            : ""),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo deshacer.");
    } finally {
      setUndoing(false);
    }
  }

  return (
    <div className="max-w-2xl rounded-2xl border border-thor-line bg-thor-paper p-6">
      <p className="text-sm text-thor-ink">
        Subí o bajá los precios de muchos productos de una vez, por porcentaje. Primero ves una vista previa con
        ejemplos; recién después se aplica, y la última actualización se puede deshacer.
      </p>

      <form onSubmit={handlePreview} className="mt-5 space-y-5">
        <fieldset>
          <legend className={LABEL}>Qué productos</legend>
          <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-thor-ink">
            <label className="flex items-center gap-1.5 font-semibold">
              <input type="checkbox" checked={allTypes} onChange={() => changeTypes(allTypes ? [] : [...PRODUCT_TYPES])} />
              Todos los tipos
            </label>
            {PRODUCT_TYPES.map((t) => (
              <label key={t} className="flex items-center gap-1.5">
                <input type="checkbox" checked={types.includes(t)} onChange={() => toggleType(t)} />
                {PRODUCT_TYPE_LABELS[t]}
              </label>
            ))}
          </div>
        </fieldset>

        <label className="block">
          <span className={LABEL}>Equipo</span>
          <select value={club} onChange={(e) => changeClub(e.target.value)} className={INPUT}>
            <option value="">Todos los equipos</option>
            <option value="none">Solo los que no tienen equipo</option>
            <optgroup label="Clubes">
              {CLUBS_SORTED("club").map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.name}
                </option>
              ))}
            </optgroup>
            <optgroup label="Selecciones">
              {CLUBS_SORTED("selection").map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.name}
                </option>
              ))}
            </optgroup>
          </select>
        </label>

        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className={LABEL}>Cambio (%)</span>
            <input
              type="number"
              step="0.1"
              min={PRICE_LIMITS.minPercent}
              max={PRICE_LIMITS.maxPercent}
              value={percent}
              onChange={(e) => changePercent(e.target.value)}
              placeholder="ej. 8 o -10"
              className={INPUT}
            />
          </label>
          <label className="block">
            <span className={LABEL}>Redondear a</span>
            <select value={rounding} onChange={(e) => changeRounding(Number(e.target.value))} className={INPUT}>
              {ROUNDING_OPTIONS.map((r) => (
                <option key={r} value={r}>
                  {r === 1 ? "Sin redondeo" : money(r)}
                </option>
              ))}
            </select>
          </label>
        </div>
        <p className="-mt-3 text-xs text-thor-muted">
          Un número positivo sube los precios (8 = +8%) y uno negativo los baja (−10 = −10%). Entre {PRICE_LIMITS.minPercent}%
          y +{PRICE_LIMITS.maxPercent}% por vez.
        </p>

        <label className="flex items-center gap-2 text-sm text-thor-ink">
          <input type="checkbox" checked={includeSale} onChange={(e) => changeIncludeSale(e.target.checked)} />
          También ajustar los precios en oferta (con el mismo porcentaje)
        </label>

        <button type="submit" disabled={previewing || applying} className={`${BTN} border border-thor-line text-thor-ink hover:border-thor-gold`}>
          {previewing ? "Calculando…" : "Ver vista previa"}
        </button>
      </form>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
      {message && (
        <p className="mt-4 rounded-lg border border-thor-line bg-thor-cream px-4 py-3 text-sm text-thor-ink">{message}</p>
      )}

      {preview && (
        <div className="mt-6 rounded-xl border border-thor-line bg-thor-cream p-4">
          {preview.count === 0 ? (
            <p className="text-sm text-thor-ink">
              Con estos datos no cambia ningún precio
              {preview.unchanged > 0 ? ` (${preview.unchanged.toLocaleString("es-AR")} productos quedarían igual por el redondeo)` : " (no hay productos que coincidan)"}.
            </p>
          ) : (
            <>
              <p className="text-sm text-thor-ink">
                Se van a cambiar <strong>{preview.count.toLocaleString("es-AR")}</strong> productos
                {preview.unchanged > 0 && <> ({preview.unchanged.toLocaleString("es-AR")} quedarían igual por el redondeo)</>}.
              </p>
              <p className="mt-1 text-xs text-thor-muted">
                Precios nuevos entre {money(preview.minNew)} y {money(preview.maxNew)}. Cambio promedio real:{" "}
                {formatPercent(preview.avgChangePercent)}.
                {preview.withSale > 0 && (
                  <>
                    {" "}
                    {preview.withSale.toLocaleString("es-AR")} tienen precio en oferta
                    {params.includeSale ? " y también se ajusta." : " y NO se ajusta."}
                  </>
                )}
              </p>

              <div className="mt-3 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left font-mono text-[11px] uppercase tracking-wide text-thor-muted">
                      <th className="py-1 pr-3">Ejemplos</th>
                      <th className="py-1 pr-3 text-right">Antes</th>
                      <th className="py-1 text-right">Después</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.sample.map((s) => (
                      <tr key={s.id} className="border-t border-thor-line">
                        <td className="max-w-[260px] truncate py-1.5 pr-3 text-thor-ink" title={s.team}>
                          {displayName(s.team, s.type)}
                        </td>
                        <td className="py-1.5 pr-3 text-right font-mono tabular-nums text-thor-muted">
                          {money(s.price)}
                          {s.salePrice != null && <span className="block text-[11px]">oferta {money(s.salePrice)}</span>}
                        </td>
                        <td className="py-1.5 text-right font-mono font-bold tabular-nums text-thor-ink">
                          {money(s.newPrice)}
                          {s.newSalePrice != null && <span className="block text-[11px] font-normal">oferta {money(s.newSalePrice)}</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <button
                type="button"
                onClick={handleApply}
                disabled={applying}
                className={`${BTN} mt-4 bg-thor-gold text-thor-ink`}
              >
                {applying ? "Aplicando…" : `Aplicar a ${preview.count.toLocaleString("es-AR")} productos`}
              </button>
            </>
          )}
        </div>
      )}

      {history.history.length > 0 && (
        <div className="mt-8">
          <h3 className="font-mono text-xs font-bold uppercase tracking-wide text-thor-ink">Últimas actualizaciones</h3>
          <ul className="mt-3 divide-y divide-thor-line rounded-xl border border-thor-line bg-thor-cream">
            {history.history.map((h) => (
              <li key={h.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-2.5 text-sm">
                <span className="font-mono text-xs text-thor-muted">
                  {new Date(h.createdAt).toLocaleString("es-AR", { dateStyle: "short", timeStyle: "short" })}
                </span>
                <span className="font-bold text-thor-ink">{formatPercent(h.percent)}</span>
                <span className="min-w-0 flex-1 truncate text-thor-ink-soft" title={scopeText(h.scope)}>
                  {scopeText(h.scope)} · {h.count.toLocaleString("es-AR")} productos
                </span>
                {h.revertedAt ? (
                  <span className="font-mono text-xs text-thor-muted">
                    Deshecha el {new Date(h.revertedAt).toLocaleDateString("es-AR")}
                  </span>
                ) : h.id === history.undoableId ? (
                  <button
                    type="button"
                    onClick={handleUndo}
                    disabled={undoing}
                    className="rounded-md border border-thor-line px-2.5 py-1 font-mono text-xs text-thor-ink hover:border-thor-gold disabled:opacity-60"
                  >
                    {undoing ? "Deshaciendo…" : "Deshacer"}
                  </button>
                ) : null}
              </li>
            ))}
          </ul>
          <p className="mt-2 text-xs text-thor-muted">
            “Deshacer” vuelve la última actualización. Si un precio se editó a mano después, ese no se toca.
          </p>
        </div>
      )}
    </div>
  );
}
