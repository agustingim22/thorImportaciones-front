"use client";

import { useEffect, useState } from "react";
import { adminGetBundle, adminSetBundle } from "@/lib/admin";
import { BUNDLE_LIMITS, bundleDiscount } from "@/lib/bundle";

const INPUT = "w-full rounded-lg border border-thor-line bg-thor-cream px-3 py-2 text-thor-ink";
const LABEL = "mb-1 block font-mono text-[11px] uppercase tracking-wide text-thor-muted";

const isInt = (n: number, min: number, max: number) => Number.isInteger(n) && n >= min && n <= max;

/** Descuento por cantidad ("combo"): si el carrito tiene N camisetas o más, se descuenta un % del total de
 *  productos. Hay un escalón obligatorio y uno opcional (más camisetas, más descuento). Lo configura el admin; el
 *  precio final siempre lo calcula el servidor al crear el pedido. */
export function AdminBundle() {
  const [enabled, setEnabled] = useState(false);
  const [minQty, setMinQty] = useState("2");
  const [percent, setPercent] = useState("10");
  const [second, setSecond] = useState(false);
  const [minQty2, setMinQty2] = useState("3");
  const [percent2, setPercent2] = useState("15");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  function load(s: { enabled: boolean; minQty: number; percent: number; minQty2: number | null; percent2: number | null }) {
    setEnabled(s.enabled);
    setMinQty(String(s.minQty));
    setPercent(String(s.percent));
    setSecond(s.minQty2 != null && s.percent2 != null);
    if (s.minQty2 != null) setMinQty2(String(s.minQty2));
    if (s.percent2 != null) setPercent2(String(s.percent2));
  }

  useEffect(() => {
    adminGetBundle()
      .then(load)
      .catch((err) => setError(err instanceof Error ? err.message : "No se pudo cargar la configuración."))
      .finally(() => setLoading(false));
  }, []);

  const { minQty: qLim, percent: pLim } = BUNDLE_LIMITS;
  const q1 = Number(minQty), p1 = Number(percent), q2 = Number(minQty2), p2 = Number(percent2);
  const tier1Ok = isInt(q1, qLim.min, qLim.max) && isInt(p1, pLim.min, pLim.max);
  const tier2Ok = !second || (isInt(q2, q1 + 1, qLim.max) && isInt(p2, p1 + 1, pLim.max));

  // Ejemplo en vivo con camisetas de $60.000, para ver el efecto antes de guardar.
  const EXAMPLE_PRICE = 60000;
  const example = (qty: number, pct: number) => {
    const subtotal = EXAMPLE_PRICE * qty;
    const discount = bundleDiscount(subtotal, qty, { enabled: true, minQty: qty, percent: pct, minQty2: null, percent2: null });
    return { qty, subtotal, discount, total: subtotal - discount };
  };
  const ex1 = tier1Ok ? example(q1, p1) : null;
  const ex2 = tier1Ok && second && tier2Ok ? example(q2, p2) : null;

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaved(false);
    if (!tier1Ok) {
      setError(
        `Revisá el primer escalón: la cantidad va de ${qLim.min} a ${qLim.max} y el descuento de ${pLim.min}% a ${pLim.max}%, en números enteros.`,
      );
      return;
    }
    if (!tier2Ok) {
      setError(
        `El segundo escalón tiene que pedir más de ${q1} camisetas (hasta ${qLim.max}) y descontar más de ${p1}% (hasta ${pLim.max}%).`,
      );
      return;
    }
    setSaving(true);
    try {
      const s = await adminSetBundle({
        enabled,
        minQty: q1,
        percent: p1,
        minQty2: second ? q2 : null,
        percent2: second ? p2 : null,
      });
      load(s);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p className="text-sm text-thor-muted">Cargando…</p>;

  return (
    <form onSubmit={handleSave} className="max-w-md rounded-2xl border border-thor-line bg-thor-paper p-6">
      <p className="text-sm text-thor-ink">
        Descuento por cantidad: cuando el carrito llega a cierta cantidad de camisetas, se descuenta un porcentaje
        de todo el pedido. El cliente ve cuánto le falta para activarlo.
      </p>

      <label className="mt-5 flex items-center gap-2 text-sm text-thor-ink">
        <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} />
        Combo activado
      </label>

      <p className="mt-4 font-mono text-[11px] uppercase tracking-wide text-thor-ink">Primer escalón</p>
      <div className="mt-2 grid grid-cols-2 gap-3">
        <label className="block">
          <span className={LABEL}>Desde (camisetas)</span>
          <input
            type="number"
            min={qLim.min}
            max={qLim.max}
            value={minQty}
            onChange={(e) => setMinQty(e.target.value)}
            className={INPUT}
          />
        </label>
        <label className="block">
          <span className={LABEL}>Descuento (%)</span>
          <input
            type="number"
            min={pLim.min}
            max={pLim.max}
            value={percent}
            onChange={(e) => setPercent(e.target.value)}
            className={INPUT}
          />
        </label>
      </div>

      <label className="mt-4 flex items-center gap-2 text-sm text-thor-ink">
        <input type="checkbox" checked={second} onChange={(e) => setSecond(e.target.checked)} />
        Sumar un segundo escalón (más camisetas, más descuento)
      </label>
      {second && (
        <div className="mt-2 grid grid-cols-2 gap-3">
          <label className="block">
            <span className={LABEL}>Desde (camisetas)</span>
            <input
              type="number"
              min={q1 + 1}
              max={qLim.max}
              value={minQty2}
              onChange={(e) => setMinQty2(e.target.value)}
              className={INPUT}
            />
          </label>
          <label className="block">
            <span className={LABEL}>Descuento (%)</span>
            <input
              type="number"
              min={p1 + 1}
              max={pLim.max}
              value={percent2}
              onChange={(e) => setPercent2(e.target.value)}
              className={INPUT}
            />
          </label>
        </div>
      )}

      {ex1 && (
        <div className="mt-3 rounded-lg bg-thor-cream-2 px-3 py-2 text-xs text-thor-ink-soft">
          {[ex1, ex2].filter((x): x is NonNullable<typeof ex1> => !!x).map((x) => (
            <p key={x.qty}>
              Ejemplo: {x.qty} camisetas de ${EXAMPLE_PRICE.toLocaleString("es-AR")} suman $
              {x.subtotal.toLocaleString("es-AR")}; el cliente ahorra{" "}
              <strong className="text-thor-ink">${x.discount.toLocaleString("es-AR")}</strong> y paga $
              {x.total.toLocaleString("es-AR")} (más envío).
            </p>
          ))}
        </div>
      )}

      <ul className="mt-4 list-disc pl-5 text-xs text-thor-muted">
        <li>No se acumula con un cupón: se aplica el que más descuenta (si gana el combo, el cupón no se gasta).</li>
        <li>El descuento se calcula sobre el subtotal de productos, sin el envío.</li>
        <li>Apagado, no se muestra ni se aplica en ningún lado. Los pedidos ya hechos no cambian.</li>
      </ul>

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={saving}
        className="mt-5 rounded-lg bg-thor-gold px-5 py-2.5 font-mono text-xs font-bold uppercase tracking-wider text-thor-ink disabled:opacity-60"
      >
        {saving ? "Guardando…" : saved ? "✓ Guardado" : "Guardar"}
      </button>
    </form>
  );
}
