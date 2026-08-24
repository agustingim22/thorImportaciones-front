"use client";

import { useCallback, useEffect, useState } from "react";
import {
  adminCreateCoupon,
  adminDeleteCoupon,
  adminListCoupons,
  adminUpdateCoupon,
  type AdminCoupon,
  type CouponInput,
} from "@/lib/admin";

const EMPTY: CouponInput = {
  code: "",
  type: "percentage",
  value: 10,
  active: true,
  expiresAt: null,
  maxUses: null,
  minOrderValue: null,
};

const inputCls = "w-full rounded-lg border border-thor-line bg-thor-paper px-3 py-2 text-thor-ink";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block font-mono text-[11px] uppercase tracking-wide text-thor-muted">
        {label}
      </span>
      {children}
    </label>
  );
}

function describeCoupon(c: AdminCoupon): string {
  return c.type === "percentage" ? `${c.value}%` : `$${c.value.toLocaleString("es-AR")}`;
}

export function AdminCoupons() {
  const [coupons, setCoupons] = useState<AdminCoupon[]>([]);
  const [loading, setLoading] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<CouponInput>(EMPTY);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setCoupons(await adminListCoupons());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function openNew() {
    setEditingId(null);
    setForm(EMPTY);
    setFormError("");
    setShowForm(true);
  }

  function openEdit(c: AdminCoupon) {
    setEditingId(c.id);
    setForm({
      code: c.code,
      type: c.type,
      value: c.value,
      active: c.active,
      expiresAt: c.expiresAt ? c.expiresAt.slice(0, 10) : null,
      maxUses: c.maxUses,
      minOrderValue: c.minOrderValue,
    });
    setFormError("");
    setShowForm(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");
    setSaving(true);
    try {
      if (editingId) await adminUpdateCoupon(editingId, form);
      else await adminCreateCoupon(form);
      setShowForm(false);
      await load();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "No se pudo guardar.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(c: AdminCoupon) {
    if (!confirm(`¿Borrar el cupón "${c.code}"? Esta acción no se puede deshacer.`)) return;
    await adminDeleteCoupon(c.id);
    await load();
  }

  async function toggleActive(c: AdminCoupon) {
    await adminUpdateCoupon(c.id, {
      code: c.code,
      type: c.type,
      value: c.value,
      active: !c.active,
      expiresAt: c.expiresAt,
      maxUses: c.maxUses,
      minOrderValue: c.minOrderValue,
    });
    await load();
  }

  return (
    <div>
      <div className="flex justify-end">
        <button
          onClick={openNew}
          className="rounded-lg bg-thor-gold px-4 py-2.5 font-mono text-xs font-bold uppercase tracking-wider text-thor-ink"
        >
          + Nuevo cupón
        </button>
      </div>

      <div className="mt-4 overflow-x-auto rounded-2xl border border-thor-line bg-thor-paper">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-thor-line text-left font-mono text-[11px] uppercase tracking-wide text-thor-muted">
              <th className="px-4 py-3">Código</th>
              <th className="px-4 py-3">Descuento</th>
              <th className="px-4 py-3">Usos</th>
              <th className="px-4 py-3">Vence</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-thor-muted">
                  Cargando…
                </td>
              </tr>
            )}
            {!loading && coupons.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-thor-muted">
                  Todavía no creaste ningún cupón.
                </td>
              </tr>
            )}
            {!loading &&
              coupons.map((c) => (
                <tr key={c.id} className="border-b border-thor-line last:border-0 align-top">
                  <td className="px-4 py-3 font-mono font-bold text-thor-ink">{c.code}</td>
                  <td className="px-4 py-3 text-thor-gold">{describeCoupon(c)}</td>
                  <td className="px-4 py-3 tabular-nums text-thor-muted">
                    {c.usedCount}
                    {c.maxUses !== null ? ` / ${c.maxUses}` : ""}
                  </td>
                  <td className="px-4 py-3 text-thor-muted">
                    {c.expiresAt ? new Date(c.expiresAt).toLocaleDateString("es-AR") : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => toggleActive(c)}
                      className={`rounded-full px-2 py-0.5 font-mono text-[10px] uppercase tabular-nums ${
                        c.active ? "bg-thor-land/15 text-thor-land" : "bg-thor-muted/15 text-thor-muted"
                      }`}
                    >
                      {c.active ? "Activo" : "Desactivado"}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => openEdit(c)}
                        className="rounded-md border border-thor-line px-2.5 py-1 font-mono text-xs text-thor-ink hover:border-thor-gold"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleDelete(c)}
                        className="rounded-md border border-thor-line px-2.5 py-1 font-mono text-xs text-red-600 hover:border-red-500"
                      >
                        Borrar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4">
          <form
            onSubmit={handleSave}
            className="mt-10 w-full max-w-lg rounded-2xl border border-thor-line bg-thor-cream p-6"
          >
            <h2 className="font-display text-2xl tracking-wide text-thor-ink">
              {editingId ? "Editar cupón" : "Nuevo cupón"}
            </h2>

            <div className="mt-4 grid gap-3">
              <Field label="Código">
                <input
                  required
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                  placeholder="VERANO10"
                  className={`${inputCls} font-mono uppercase`}
                />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Tipo de descuento">
                  <select
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value as CouponInput["type"] })}
                    className={inputCls}
                  >
                    <option value="percentage">Porcentaje (%)</option>
                    <option value="fixed">Monto fijo ($)</option>
                  </select>
                </Field>
                <Field label={form.type === "percentage" ? "Porcentaje" : "Monto ($)"}>
                  <input
                    required
                    type="number"
                    min={1}
                    max={form.type === "percentage" ? 100 : undefined}
                    value={form.value}
                    onChange={(e) => setForm({ ...form, value: Number(e.target.value) })}
                    className={inputCls}
                  />
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Vence (opcional)">
                  <input
                    type="date"
                    value={form.expiresAt ?? ""}
                    onChange={(e) => setForm({ ...form, expiresAt: e.target.value || null })}
                    className={inputCls}
                  />
                </Field>
                <Field label="Límite de usos (opcional)">
                  <input
                    type="number"
                    min={1}
                    value={form.maxUses ?? ""}
                    onChange={(e) =>
                      setForm({ ...form, maxUses: e.target.value ? Number(e.target.value) : null })
                    }
                    placeholder="Sin límite"
                    className={inputCls}
                  />
                </Field>
              </div>
              <Field label="Compra mínima en $ (opcional)">
                <input
                  type="number"
                  min={0}
                  value={form.minOrderValue ?? ""}
                  onChange={(e) =>
                    setForm({ ...form, minOrderValue: e.target.value ? Number(e.target.value) : null })
                  }
                  placeholder="Sin mínimo"
                  className={inputCls}
                />
              </Field>
              <label className="flex items-center gap-2 text-sm text-thor-ink">
                <input
                  type="checkbox"
                  checked={form.active}
                  onChange={(e) => setForm({ ...form, active: e.target.checked })}
                />
                Activo (se puede usar en el carrito)
              </label>
            </div>

            {formError && <p className="mt-3 text-sm text-red-600">{formError}</p>}

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="rounded-lg border border-thor-line px-4 py-2.5 font-mono text-xs font-bold uppercase tracking-wider text-thor-muted"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saving}
                className="rounded-lg bg-thor-gold px-4 py-2.5 font-mono text-xs font-bold uppercase tracking-wider text-thor-ink disabled:opacity-60"
              >
                {saving ? "Guardando…" : "Guardar"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
