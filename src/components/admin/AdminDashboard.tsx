"use client";

import { useCallback, useEffect, useState } from "react";
import type { Product } from "@/lib/api";
import {
  adminCreateProduct,
  adminDeleteProduct,
  adminListProducts,
  adminPing,
  adminUpdateProduct,
  adminUploadImage,
  clearToken,
  getToken,
  setToken,
  type ProductInput,
} from "@/lib/admin";

const EMPTY: ProductInput = {
  team: "",
  type: "retro",
  number: 0,
  price: 0,
  fabric: "",
  colorCss: "",
  imageUrl: null,
  description: "",
  inStock: true,
  slug: null,
};

export function AdminDashboard() {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [tokenInput, setTokenInput] = useState("");
  const [loginError, setLoginError] = useState("");

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<ProductInput>(EMPTY);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setProducts(await adminListProducts());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const t = getToken();
    if (!t) {
      setAuthed(false);
      return;
    }
    adminPing(t).then((ok) => {
      if (ok) {
        setAuthed(true);
        load();
      } else {
        clearToken();
        setAuthed(false);
      }
    });
  }, [load]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoginError("");
    const ok = await adminPing(tokenInput.trim());
    if (ok) {
      setToken(tokenInput.trim());
      setAuthed(true);
      load();
    } else {
      setLoginError("Token incorrecto.");
    }
  }

  function openNew() {
    setEditingId(null);
    setForm(EMPTY);
    setFormError("");
    setShowForm(true);
  }

  function openEdit(p: Product) {
    setEditingId(p.id);
    setForm({
      team: p.team,
      type: p.type,
      number: p.number,
      price: p.price,
      fabric: p.fabric,
      colorCss: p.colorCss,
      imageUrl: p.imageUrl,
      description: p.description,
      inStock: p.inStock,
      slug: p.slug,
    });
    setFormError("");
    setShowForm(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");
    setSaving(true);
    try {
      if (editingId) await adminUpdateProduct(editingId, form);
      else await adminCreateProduct(form);
      setShowForm(false);
      await load();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "No se pudo guardar.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(p: Product) {
    if (!confirm(`¿Borrar "${p.team}"? Esta acción no se puede deshacer.`)) return;
    await adminDeleteProduct(p.id);
    await load();
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFormError("");
    setUploading(true);
    try {
      const url = await adminUploadImage(file);
      setForm((f) => ({ ...f, imageUrl: url }));
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "No se pudo subir la imagen.");
    } finally {
      setUploading(false);
      e.target.value = ""; // permite re-subir el mismo archivo
    }
  }

  // ---- Estados de carga / login ----
  if (authed === null) {
    return <p className="p-10 text-center text-thor-muted">Cargando…</p>;
  }

  if (!authed) {
    return (
      <div className="mx-auto max-w-sm px-5 py-20">
        <h1 className="font-display text-3xl tracking-wide text-thor-ink">Panel Thor</h1>
        <p className="mt-2 text-sm text-thor-muted">Ingresá el token de administrador.</p>
        <form onSubmit={handleLogin} className="mt-6 flex flex-col gap-3">
          <input
            type="password"
            value={tokenInput}
            onChange={(e) => setTokenInput(e.target.value)}
            placeholder="Token de admin"
            className="rounded-lg border border-thor-line bg-thor-paper px-3 py-2.5 text-thor-ink"
            autoFocus
          />
          {loginError && <p className="text-sm text-red-600">{loginError}</p>}
          <button
            type="submit"
            className="rounded-lg bg-thor-gold px-4 py-2.5 font-mono text-sm font-bold uppercase tracking-wider text-thor-ink"
          >
            Entrar
          </button>
        </form>
      </div>
    );
  }

  // ---- Panel ----
  return (
    <div className="mx-auto max-w-5xl px-5 py-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl tracking-wide text-thor-ink">Panel · Productos</h1>
          <p className="text-sm text-thor-muted">{products.length} camisetas en el catálogo</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={openNew}
            className="rounded-lg bg-thor-gold px-4 py-2.5 font-mono text-xs font-bold uppercase tracking-wider text-thor-ink"
          >
            + Nueva camiseta
          </button>
          <button
            onClick={() => {
              clearToken();
              setAuthed(false);
            }}
            className="rounded-lg border border-thor-line px-4 py-2.5 font-mono text-xs font-bold uppercase tracking-wider text-thor-muted hover:text-thor-ink"
          >
            Salir
          </button>
        </div>
      </div>

      {/* Tabla */}
      <div className="mt-6 overflow-x-auto rounded-2xl border border-thor-line bg-thor-paper">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-thor-line text-left font-mono text-[11px] uppercase tracking-wide text-thor-muted">
              <th className="px-4 py-3">Camiseta</th>
              <th className="px-4 py-3">Tipo</th>
              <th className="px-4 py-3">N°</th>
              <th className="px-4 py-3">Precio</th>
              <th className="px-4 py-3">Stock</th>
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
            {!loading &&
              products.map((p) => (
                <tr key={p.id} className="border-b border-thor-line last:border-0">
                  <td className="px-4 py-3 font-semibold text-thor-ink">{p.team}</td>
                  <td className="px-4 py-3 text-thor-muted">
                    {p.type === "retro" ? "Retro" : "Player"}
                  </td>
                  <td className="px-4 py-3 tabular-nums">{p.number}</td>
                  <td className="px-4 py-3 font-mono tabular-nums text-thor-gold">
                    ${p.price.toLocaleString("es-AR")}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 font-mono text-[10px] uppercase ${
                        p.inStock ? "bg-thor-land/15 text-thor-land" : "bg-red-500/10 text-red-600"
                      }`}
                    >
                      {p.inStock ? "En stock" : "Sin stock"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => openEdit(p)}
                        className="rounded-md border border-thor-line px-2.5 py-1 font-mono text-xs text-thor-ink hover:border-thor-gold"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleDelete(p)}
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

      {/* Formulario (modal simple) */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4">
          <form
            onSubmit={handleSave}
            className="mt-10 w-full max-w-lg rounded-2xl border border-thor-line bg-thor-cream p-6"
          >
            <h2 className="font-display text-2xl tracking-wide text-thor-ink">
              {editingId ? "Editar camiseta" : "Nueva camiseta"}
            </h2>

            <div className="mt-4 grid gap-3">
              <Field label="Nombre / equipo">
                <input
                  required
                  value={form.team}
                  onChange={(e) => setForm({ ...form, team: e.target.value })}
                  className={inputCls}
                />
              </Field>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Tipo">
                  <select
                    value={form.type}
                    onChange={(e) =>
                      setForm({ ...form, type: e.target.value as "retro" | "player" })
                    }
                    className={inputCls}
                  >
                    <option value="retro">Retro Fan</option>
                    <option value="player">Player Version</option>
                  </select>
                </Field>
                <Field label="Número (0-99)">
                  <input
                    type="number"
                    min={0}
                    max={99}
                    value={form.number}
                    onChange={(e) => setForm({ ...form, number: Number(e.target.value) })}
                    className={inputCls}
                  />
                </Field>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Precio (ARS)">
                  <input
                    type="number"
                    min={0}
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
                    className={inputCls}
                  />
                </Field>
                <Field label="Tela">
                  <input
                    value={form.fabric}
                    onChange={(e) => setForm({ ...form, fabric: e.target.value })}
                    className={inputCls}
                  />
                </Field>
              </div>

              <Field label="Foto de la camiseta (opcional)">
                <div className="flex items-center gap-3">
                  {form.imageUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={form.imageUrl}
                      alt="Vista previa"
                      className="h-16 w-16 rounded-lg border border-thor-line object-cover"
                    />
                  )}
                  <label className="cursor-pointer rounded-lg border border-thor-line bg-thor-paper px-3 py-2 font-mono text-xs font-bold uppercase tracking-wider text-thor-ink hover:border-thor-gold">
                    {uploading ? "Subiendo…" : form.imageUrl ? "Cambiar foto" : "Subir foto"}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleUpload}
                      disabled={uploading}
                    />
                  </label>
                  {form.imageUrl && (
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, imageUrl: null })}
                      className="font-mono text-xs text-thor-muted underline"
                    >
                      Quitar
                    </button>
                  )}
                </div>
                <input
                  type="url"
                  value={form.imageUrl ?? ""}
                  onChange={(e) => setForm({ ...form, imageUrl: e.target.value || null })}
                  placeholder="…o pegá una URL de imagen"
                  className={`${inputCls} mt-2`}
                />
              </Field>

              <Field label="Descripción">
                <textarea
                  rows={2}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className={inputCls}
                />
              </Field>

              <label className="flex items-center gap-2 text-sm text-thor-ink">
                <input
                  type="checkbox"
                  checked={form.inStock}
                  onChange={(e) => setForm({ ...form, inStock: e.target.checked })}
                />
                En stock (visible en el catálogo con disponibilidad)
              </label>

              {formError && <p className="text-sm text-red-600">{formError}</p>}
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="rounded-lg border border-thor-line px-4 py-2 font-mono text-xs font-bold uppercase tracking-wider text-thor-muted"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saving}
                className="rounded-lg bg-thor-gold px-4 py-2 font-mono text-xs font-bold uppercase tracking-wider text-thor-ink disabled:opacity-60"
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
