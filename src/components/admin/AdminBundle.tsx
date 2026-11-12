"use client";

import { useEffect, useState } from "react";
import { adminGetBundle, adminSetBundle } from "@/lib/admin";
import { BUNDLE_LIMITS, bundleDiscount } from "@/lib/bundle";

const INPUT = "w-full rounded-lg border border-thor-line bg-thor-cream px-3 py-2 text-thor-ink";
const LABEL = "mb-1 block font-mono text-[11px] uppercase tracking-wide text-thor-muted";

/** Descuento por cantidad ("combo"): si el carrito tiene N camisetas o más, se descuenta un % del total de
 *  productos. Lo configura el admin; el precio final siempre lo calcula el servidor al crear el pedido. */
export function AdminBundle() {
  const [enabled, setEnabled] = useState(false);
  const [minQty, setMinQty] = useState("2");
  const [percent, setPercent] = useState("10");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    adminGetBundle()
      .then((s) => {
        setEnabled(s.enabled);
        setMinQty(String(s.minQty));
        setPercent(String(s.percent));
      })
      .catch((err) => setError(err instanceof Error ? err.message : "No se pudo cargar la configuración."))
      .finally(() => setLoading(false));
  }, []);

  const qtyN = Number(minQty);
  const pctN = Number(percent);
  const qtyOk = Number.isInteger(qtyN) && qtyN >= BUNDLE_LIMITS.minQty.min && qtyN <= BUNDLE_LIMITS.minQty.max;
  const pctOk = Number.isInteger(pctN) && pctN >= BUNDLE_LIMITS.percent.min && pctN <= BUNDLE_LIMITS.percent.max;

  // Ejemplo en vivo con camisetas de $60.000, para ver el efecto antes de guardar.
  const EXAMPLE_PRICE = 60000;
  const exampleSubtotal = qtyOk ? EXAMPLE_PRICE * qtyN : 0;
  const exampleDiscount = qtyOk && pctOk ? bundleDiscount(exampleSubtotal, qtyN, { enabled: true, minQty: qtyN, percent: pctN }) : 0;

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaved(false);
    if (!qtyOk) {
      setError(`La cantidad mínima tiene que ser un número entero entre ${BUNDLE_LIMITS.minQty.min} y ${BUNDLE_LIMITS.minQty.max}.`);
      return;
    }
    if (!pctOk) {
      setError(`El descuento tiene que ser un número entero entre ${BUNDLE_LIMITS.percent.min}% y ${BUNDLE_LIMITS.percent.max}%.`);
      return;
    }
    setSaving(true);
    try {
      const s = await adminSetBundle({ enabled, minQty: qtyN, percent: pctN });
      setEnabled(s.enabled);
      setMinQty(String(s.minQty));
      setPercent(String(s.percent));
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

      <div className="mt-4 grid grid-cols-2 gap-3">
        <label className="block">
          <span className={LABEL}>Desde (camisetas)</span>
          <input
            type="number"
            min={BUNDLE_LIMITS.minQty.min}
            max={BUNDLE_LIMITS.minQty.max}
            value={minQty}
            onChange={(e) => setMinQty(e.target.value)}
            className={INPUT}
          />
        </label>
        <label className="block">
          <span className={LABEL}>Descuento (%)</span>
          <input
            type="number"
            min={BUNDLE_LIMITS.percent.min}
            max={BUNDLE_LIMITS.percent.max}
            value={percent}
            onChange={(e) => setPercent(e.target.value)}
            className={INPUT}
          />
        </label>
      </div>

      {qtyOk && pctOk && (
        <p className="mt-3 rounded-lg bg-thor-cream-2 px-3 py-2 text-xs text-thor-ink-soft">
          Ejemplo: {qtyN} camisetas de ${EXAMPLE_PRICE.toLocaleString("es-AR")} suman $
          {exampleSubtotal.toLocaleString("es-AR")}; con el combo el cliente ahorra{" "}
          <strong className="text-thor-ink">${exampleDiscount.toLocaleString("es-AR")}</strong> y paga $
          {(exampleSubtotal - exampleDiscount).toLocaleString("es-AR")} (más envío).
        </p>
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
