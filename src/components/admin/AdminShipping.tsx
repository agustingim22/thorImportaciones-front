"use client";

import { useEffect, useState } from "react";
import { adminGetShipping, adminSetShipping } from "@/lib/admin";

export function AdminShipping() {
  const [flatCost, setFlatCost] = useState("0");
  const [freeShipping, setFreeShipping] = useState(false);
  const [threshold, setThreshold] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    adminGetShipping()
      .then((s) => {
        setFlatCost(String(s.flatCost));
        if (s.freeShippingThreshold != null) {
          setFreeShipping(true);
          setThreshold(String(s.freeShippingThreshold));
        }
      })
      .finally(() => setLoading(false));
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaved(false);

    const cost = Number(flatCost);
    if (!Number.isInteger(cost) || cost < 0) {
      setError("El costo de envío debe ser un número entero mayor o igual a 0.");
      return;
    }
    let freeShippingThreshold: number | null = null;
    if (freeShipping) {
      const t = Number(threshold);
      if (!Number.isInteger(t) || t < 0) {
        setError("Ingresá un monto válido para el envío gratis.");
        return;
      }
      freeShippingThreshold = t;
    }

    setSaving(true);
    try {
      await adminSetShipping({ flatCost: cost, freeShippingThreshold });
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
    <form
      onSubmit={handleSave}
      className="max-w-md rounded-2xl border border-thor-line bg-thor-paper p-6"
    >
      <label className="block">
        <span className="mb-1 block font-mono text-[11px] uppercase tracking-wide text-thor-muted">
          Costo de envío fijo ($)
        </span>
        <input
          type="number"
          min={0}
          value={flatCost}
          onChange={(e) => setFlatCost(e.target.value)}
          className="w-full rounded-lg border border-thor-line bg-thor-cream px-3 py-2 text-thor-ink"
        />
      </label>
      <p className="mt-1 text-xs text-thor-muted">
        Se suma automáticamente al total de los pedidos de catálogo (no aplica a pedidos
        personalizados, que se coordinan por WhatsApp).
      </p>

      <label className="mt-5 flex items-center gap-2 text-sm text-thor-ink">
        <input
          type="checkbox"
          checked={freeShipping}
          onChange={(e) => setFreeShipping(e.target.checked)}
        />
        Ofrecer envío gratis a partir de un monto
      </label>
      {freeShipping && (
        <label className="mt-3 block">
          <span className="mb-1 block font-mono text-[11px] uppercase tracking-wide text-thor-muted">
            Monto mínimo para envío gratis ($)
          </span>
          <input
            type="number"
            min={0}
            value={threshold}
            onChange={(e) => setThreshold(e.target.value)}
            className="w-full rounded-lg border border-thor-line bg-thor-cream px-3 py-2 text-thor-ink"
          />
        </label>
      )}

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
