"use client";

import { useCallback, useEffect, useState } from "react";
import {
  adminCreateTestimonial,
  adminDeleteTestimonial,
  adminListTestimonials,
  adminUpdateTestimonial,
  type AdminTestimonial,
  type TestimonialInput,
} from "@/lib/admin";

const EMPTY: TestimonialInput = { name: "", comment: "", rating: 5, published: true };

const inputCls =
  "w-full rounded-lg border border-thor-line bg-thor-paper px-3 py-2 text-thor-ink";

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

export function AdminTestimonials() {
  const [testimonials, setTestimonials] = useState<AdminTestimonial[]>([]);
  const [loading, setLoading] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<TestimonialInput>(EMPTY);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setTestimonials(await adminListTestimonials());
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

  function openEdit(t: AdminTestimonial) {
    setEditingId(t.id);
    setForm({ name: t.name, comment: t.comment, rating: t.rating, published: t.published });
    setFormError("");
    setShowForm(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");
    setSaving(true);
    try {
      if (editingId) await adminUpdateTestimonial(editingId, form);
      else await adminCreateTestimonial(form);
      setShowForm(false);
      await load();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "No se pudo guardar.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(t: AdminTestimonial) {
    if (!confirm(`¿Borrar el testimonio de "${t.name}"? Esta acción no se puede deshacer.`)) return;
    await adminDeleteTestimonial(t.id);
    await load();
  }

  async function togglePublished(t: AdminTestimonial) {
    await adminUpdateTestimonial(t.id, {
      name: t.name,
      comment: t.comment,
      rating: t.rating,
      published: !t.published,
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
          + Nuevo testimonio
        </button>
      </div>

      <div className="mt-4 overflow-x-auto rounded-2xl border border-thor-line bg-thor-paper">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-thor-line text-left font-mono text-[11px] uppercase tracking-wide text-thor-muted">
              <th className="px-4 py-3">Cliente</th>
              <th className="px-4 py-3">Comentario</th>
              <th className="px-4 py-3">Puntaje</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-thor-muted">
                  Cargando…
                </td>
              </tr>
            )}
            {!loading && testimonials.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-thor-muted">
                  Todavía no cargaste ningún testimonio. La sección no se muestra en la web hasta
                  que haya al menos uno publicado.
                </td>
              </tr>
            )}
            {!loading &&
              testimonials.map((t) => (
                <tr key={t.id} className="border-b border-thor-line last:border-0 align-top">
                  <td className="px-4 py-3 font-semibold text-thor-ink">{t.name}</td>
                  <td className="max-w-xs px-4 py-3 text-thor-muted">{t.comment}</td>
                  <td className="px-4 py-3 text-thor-gold">{"★".repeat(t.rating)}{"☆".repeat(5 - t.rating)}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => togglePublished(t)}
                      className={`rounded-full px-2 py-0.5 font-mono text-[10px] uppercase tabular-nums ${
                        t.published ? "bg-thor-land/15 text-thor-land" : "bg-thor-muted/15 text-thor-muted"
                      }`}
                    >
                      {t.published ? "Publicado" : "Oculto"}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => openEdit(t)}
                        className="rounded-md border border-thor-line px-2.5 py-1 font-mono text-xs text-thor-ink hover:border-thor-gold"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleDelete(t)}
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
              {editingId ? "Editar testimonio" : "Nuevo testimonio"}
            </h2>

            <div className="mt-4 grid gap-3">
              <Field label="Nombre del cliente">
                <input
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className={inputCls}
                />
              </Field>
              <Field label="Comentario">
                <textarea
                  required
                  rows={4}
                  value={form.comment}
                  onChange={(e) => setForm({ ...form, comment: e.target.value })}
                  className={inputCls}
                />
              </Field>
              <Field label="Puntaje (1 a 5)">
                <select
                  value={form.rating}
                  onChange={(e) => setForm({ ...form, rating: Number(e.target.value) })}
                  className={inputCls}
                >
                  {[5, 4, 3, 2, 1].map((n) => (
                    <option key={n} value={n}>
                      {"★".repeat(n)}
                      {"☆".repeat(5 - n)}
                    </option>
                  ))}
                </select>
              </Field>
              <label className="flex items-center gap-2 text-sm text-thor-ink">
                <input
                  type="checkbox"
                  checked={form.published}
                  onChange={(e) => setForm({ ...form, published: e.target.checked })}
                />
                Publicado (visible en la web)
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
