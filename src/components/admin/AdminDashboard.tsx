"use client";

import { useCallback, useEffect, useState } from "react";
import type { Product } from "@/lib/api";
import { ALL_SIZES, DEFAULT_SIZES, PRODUCT_TYPE_LABELS, typeAllowsCustomization } from "@/lib/api";
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
  type PatchInput,
  type ProductInput,
} from "@/lib/admin";
import { AdminOrders } from "./AdminOrders";
import { AdminTestimonials } from "./AdminTestimonials";

const TYPES = Object.entries(PRODUCT_TYPE_LABELS) as [ProductInput["type"], string][];

function exportProductsCsv(products: Product[]) {
  const headers = [
    "Producto", "Tipo", "Precio", "Stock", "Talles", "Nombre predefinido",
    "Número predefinido", "Parches", "Slug", "Creado",
  ];
  const rows = products.map((p) => [
    p.team,
    PRODUCT_TYPE_LABELS[p.type],
    String(p.price),
    String(p.stock),
    p.sizes.join(", "),
    p.presetName ?? "",
    p.presetNumber ?? "",
    p.patches.map((patch) => `${patch.label}${patch.extraPrice > 0 ? ` (+$${patch.extraPrice})` : ""}`).join(" | "),
    p.slug,
    new Date(p.createdAt).toLocaleDateString("es-AR"),
  ]);
  const esc = (v: string) => `"${String(v).replace(/"/g, '""')}"`;
  const csv = "﻿" + [headers, ...rows].map((r) => r.map(esc).join(";")).join("\r\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `catalogo-thor-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

const EMPTY: ProductInput = {
  team: "",
  type: "retro",
  price: 0,
  colorCss: "",
  images: [],
  description: "",
  stock: 0,
  presetName: null,
  presetNumber: null,
  patches: [],
  sizes: DEFAULT_SIZES,
  slug: null,
};

export function AdminDashboard() {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [tab, setTab] = useState<"products" | "orders" | "testimonials">("products");
  const [tokenInput, setTokenInput] = useState("");
  const [loginError, setLoginError] = useState("");

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<ProductInput["type"] | "">("");

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<ProductInput>(EMPTY);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploadingSlot, setUploadingSlot] = useState<string | null>(null);

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
      price: p.price,
      colorCss: p.colorCss,
      images: p.images,
      description: p.description,
      stock: p.stock,
      presetName: p.presetName,
      presetNumber: p.presetNumber,
      patches: p.patches.map(({ label, imageUrl, extraPrice }) => ({ label, imageUrl, extraPrice })),
      sizes: p.sizes,
      slug: p.slug,
    });
    setFormError("");
    setShowForm(true);
  }

  function openDuplicate(p: Product) {
    setEditingId(null);
    setForm({
      team: `${p.team} (copia)`,
      type: p.type,
      price: p.price,
      colorCss: p.colorCss,
      images: p.images,
      description: p.description,
      stock: 0,
      presetName: p.presetName,
      presetNumber: p.presetNumber,
      patches: p.patches.map(({ label, imageUrl, extraPrice }) => ({ label, imageUrl, extraPrice })),
      sizes: p.sizes,
      slug: null,
    });
    setFormError("");
    setShowForm(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");
    setSaving(true);
    try {
      // Descartamos parches que quedaron incompletos (sin foto o sin nombre)
      const payload: ProductInput = {
        ...form,
        patches: form.patches.filter((p) => p.label.trim() && p.imageUrl.trim()),
      };
      if (editingId) await adminUpdateProduct(editingId, payload);
      else await adminCreateProduct(payload);
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

  // ---- Galería (hasta 3 fotos) ----
  async function handleAddGalleryImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFormError("");
    setUploadingSlot("gallery");
    try {
      const url = await adminUploadImage(file);
      setForm((f) => ({ ...f, images: [...f.images, url] }));
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "No se pudo subir la imagen.");
    } finally {
      setUploadingSlot(null);
      e.target.value = "";
    }
  }
  function removeGalleryImage(index: number) {
    setForm((f) => ({ ...f, images: f.images.filter((_, i) => i !== index) }));
  }

  // ---- Parches ----
  function addPatchRow() {
    setForm((f) => ({ ...f, patches: [...f.patches, { label: "", imageUrl: "", extraPrice: 0 }] }));
  }
  function removePatchRow(index: number) {
    setForm((f) => ({ ...f, patches: f.patches.filter((_, i) => i !== index) }));
  }
  function patchField<K extends keyof PatchInput>(index: number, field: K, value: PatchInput[K]) {
    setForm((f) => ({
      ...f,
      patches: f.patches.map((p, i) => (i === index ? { ...p, [field]: value } : p)),
    }));
  }
  async function handlePatchUpload(index: number, e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFormError("");
    setUploadingSlot(`patch-${index}`);
    try {
      const url = await adminUploadImage(file);
      patchField(index, "imageUrl", url);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "No se pudo subir la imagen.");
    } finally {
      setUploadingSlot(null);
      e.target.value = "";
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

  const q = search.trim().toLowerCase();
  const filteredProducts = products.filter((p) => {
    if (typeFilter && p.type !== typeFilter) return false;
    if (!q) return true;
    return p.team.toLowerCase().includes(q) || p.slug.toLowerCase().includes(q);
  });

  // ---- Panel ----
  return (
    <div className="mx-auto max-w-5xl px-5 py-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-3xl tracking-wide text-thor-ink">Panel Thor</h1>
        <div className="flex gap-2">
          {tab === "products" && (
            <button
              onClick={openNew}
              className="rounded-lg bg-thor-gold px-4 py-2.5 font-mono text-xs font-bold uppercase tracking-wider text-thor-ink"
            >
              + Nuevo producto
            </button>
          )}
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

      {/* Pestañas */}
      <div className="mt-5 inline-flex gap-1 rounded-xl border border-thor-line bg-thor-paper p-1">
        {(
          [
            ["products", "Productos"],
            ["orders", "Pedidos"],
            ["testimonials", "Testimonios"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`rounded-lg px-4 py-2 font-mono text-xs font-bold uppercase tracking-wider transition-colors ${
              tab === key ? "bg-thor-gold text-thor-ink" : "text-thor-muted hover:text-thor-ink"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Productos */}
      {tab === "products" && (
      <>
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <p className="text-sm text-thor-muted">
          {filteredProducts.length} de {products.length} productos
        </p>
        <button
          onClick={() => exportProductsCsv(filteredProducts)}
          disabled={filteredProducts.length === 0}
          className="rounded-lg bg-thor-land px-4 py-2 font-mono text-xs font-bold uppercase tracking-wider text-white disabled:opacity-50"
        >
          ↓ Exportar a Excel
        </button>
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por equipo…"
          className="min-w-[220px] flex-1 rounded-lg border border-thor-line bg-thor-paper px-3 py-2 text-sm text-thor-ink"
        />
        <div className="inline-flex flex-wrap gap-1 rounded-xl border border-thor-line bg-thor-paper p-1">
          <button
            onClick={() => setTypeFilter("")}
            className={`rounded-lg px-3 py-1.5 font-mono text-[11px] font-bold uppercase tracking-wider transition-colors ${
              typeFilter === "" ? "bg-thor-gold text-thor-ink" : "text-thor-muted hover:text-thor-ink"
            }`}
          >
            Todas
          </button>
          {TYPES.map(([value, label]) => (
            <button
              key={value}
              onClick={() => setTypeFilter(value)}
              className={`rounded-lg px-3 py-1.5 font-mono text-[11px] font-bold uppercase tracking-wider transition-colors ${
                typeFilter === value ? "bg-thor-gold text-thor-ink" : "text-thor-muted hover:text-thor-ink"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      <div className="mt-4 overflow-x-auto rounded-2xl border border-thor-line bg-thor-paper">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-thor-line text-left font-mono text-[11px] uppercase tracking-wide text-thor-muted">
              <th className="px-4 py-3">Producto</th>
              <th className="px-4 py-3">Tipo</th>
              <th className="px-4 py-3">Nombre / N°</th>
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
            {!loading && products.length > 0 && filteredProducts.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-thor-muted">
                  Ningún producto coincide con la búsqueda o el filtro.
                </td>
              </tr>
            )}
            {!loading &&
              filteredProducts.map((p) => (
                <tr key={p.id} className="border-b border-thor-line last:border-0">
                  <td className="px-4 py-3 font-semibold text-thor-ink">{p.team}</td>
                  <td className="px-4 py-3 text-thor-muted">{PRODUCT_TYPE_LABELS[p.type]}</td>
                  <td className="px-4 py-3 text-thor-muted">
                    {p.presetName || p.presetNumber ? (
                      <>
                        {p.presetName}
                        {p.presetName && p.presetNumber ? " · " : ""}
                        {p.presetNumber && `#${p.presetNumber}`}
                      </>
                    ) : (
                      <span className="italic">a elección</span>
                    )}
                  </td>
                  <td className="px-4 py-3 font-mono tabular-nums text-thor-gold">
                    ${p.price.toLocaleString("es-AR")}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 font-mono text-[10px] uppercase tabular-nums ${
                        p.stock === 0
                          ? "bg-red-500/10 text-red-600"
                          : p.stock <= 3
                            ? "bg-thor-gold/15 text-thor-gold"
                            : "bg-thor-land/15 text-thor-land"
                      }`}
                    >
                      {p.stock === 0 ? "Sin stock" : `${p.stock} unidad${p.stock === 1 ? "" : "es"}`}
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
                        onClick={() => openDuplicate(p)}
                        className="rounded-md border border-thor-line px-2.5 py-1 font-mono text-xs text-thor-ink hover:border-thor-gold"
                      >
                        Duplicar
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
      </>
      )}

      {/* Pedidos */}
      {tab === "orders" && (
        <div className="mt-6">
          <AdminOrders />
        </div>
      )}

      {/* Testimonios */}
      {tab === "testimonials" && (
        <div className="mt-6">
          <AdminTestimonials />
        </div>
      )}

      {/* Formulario (modal simple) */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4">
          <form
            onSubmit={handleSave}
            className="mt-10 w-full max-w-xl rounded-2xl border border-thor-line bg-thor-cream p-6"
          >
            <h2 className="font-display text-2xl tracking-wide text-thor-ink">
              {editingId ? "Editar producto" : "Nuevo producto"}
            </h2>

            <div className="mt-4 grid gap-3">
              <Field label="Nombre / equipo (o nombre del producto)">
                <input
                  required
                  value={form.team}
                  onChange={(e) => setForm({ ...form, team: e.target.value })}
                  className={inputCls}
                />
              </Field>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Tipo de producto">
                  <select
                    value={form.type}
                    onChange={(e) => {
                      const type = e.target.value as ProductInput["type"];
                      setForm(
                        typeAllowsCustomization(type)
                          ? { ...form, type }
                          : { ...form, type, presetName: null, presetNumber: null, patches: [] },
                      );
                    }}
                    className={inputCls}
                  >
                    {TYPES.map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Precio (ARS)">
                  <input
                    type="number"
                    min={0}
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
                    className={inputCls}
                  />
                </Field>
              </div>

              {typeAllowsCustomization(form.type) && (
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Nombre predefinido (opcional)">
                    <input
                      value={form.presetName ?? ""}
                      onChange={(e) => setForm({ ...form, presetName: e.target.value || null })}
                      placeholder="Ej: GONZÁLEZ"
                      className={inputCls}
                    />
                  </Field>
                  <Field label="Número predefinido (opcional)">
                    <input
                      type="number"
                      min={0}
                      max={99}
                      value={form.presetNumber ?? ""}
                      onChange={(e) => setForm({ ...form, presetNumber: e.target.value || null })}
                      placeholder="10"
                      className={inputCls}
                    />
                  </Field>
                  <p className="col-span-2 -mt-1 text-[11px] text-thor-muted">
                    Si dejás estos dos vacíos, el comprador elige su propio nombre y número al comprar.
                  </p>
                </div>
              )}

              {/* Galería de fotos */}
              <Field label={`Fotos del producto (${form.images.length}/3)`}>
                <div className="flex flex-wrap items-center gap-3">
                  {form.images.map((url, i) => (
                    <div key={i} className="relative">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={url}
                        alt={`Foto ${i + 1}`}
                        className="h-16 w-16 rounded-lg border border-thor-line object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => removeGalleryImage(i)}
                        className="absolute -right-1.5 -top-1.5 grid h-5 w-5 place-items-center rounded-full bg-thor-ink text-[10px] text-thor-cream"
                        aria-label="Quitar foto"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                  {form.images.length < 3 && (
                    <label className="cursor-pointer rounded-lg border border-thor-line bg-thor-paper px-3 py-2 font-mono text-xs font-bold uppercase tracking-wider text-thor-ink hover:border-thor-gold">
                      {uploadingSlot === "gallery" ? "Subiendo…" : "+ Agregar foto"}
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleAddGalleryImage}
                        disabled={uploadingSlot === "gallery"}
                      />
                    </label>
                  )}
                </div>
              </Field>

              {/* Parches */}
              {typeAllowsCustomization(form.type) && (
              <div>
                <span className="mb-1 block font-mono text-[11px] uppercase tracking-wide text-thor-muted">
                  Parches (opcional — el comprador elige uno)
                </span>
                <div className="flex flex-col gap-2">
                  {form.patches.map((patch, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2 rounded-lg border border-thor-line bg-thor-paper p-2"
                    >
                      {patch.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={patch.imageUrl}
                          alt={patch.label}
                          className="h-11 w-11 shrink-0 rounded-md border border-thor-line object-cover"
                        />
                      ) : (
                        <label className="grid h-11 w-11 shrink-0 cursor-pointer place-items-center rounded-md border border-dashed border-thor-line font-mono text-[9px] uppercase text-thor-muted">
                          {uploadingSlot === `patch-${i}` ? "…" : "Foto"}
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => handlePatchUpload(i, e)}
                            disabled={uploadingSlot === `patch-${i}`}
                          />
                        </label>
                      )}
                      <input
                        value={patch.label}
                        onChange={(e) => patchField(i, "label", e.target.value)}
                        placeholder="Nombre del parche"
                        className={`${inputCls} flex-1`}
                      />
                      <input
                        type="number"
                        min={0}
                        value={patch.extraPrice}
                        onChange={(e) => patchField(i, "extraPrice", Number(e.target.value))}
                        placeholder="Extra $"
                        className={`${inputCls} w-24`}
                      />
                      <button
                        type="button"
                        onClick={() => removePatchRow(i)}
                        className="shrink-0 font-mono text-xs text-thor-muted underline hover:text-red-600"
                      >
                        Quitar
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={addPatchRow}
                    className="w-fit rounded-lg border border-thor-line px-3 py-2 font-mono text-xs font-bold uppercase tracking-wider text-thor-ink hover:border-thor-gold hover:bg-thor-gold/10"
                  >
                    + Agregar parche
                  </button>
                </div>
              </div>
              )}

              <Field label="Descripción">
                <textarea
                  rows={2}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className={inputCls}
                />
              </Field>

              <Field label="Stock disponible (unidades)">
                <input
                  type="number"
                  min={0}
                  value={form.stock}
                  onChange={(e) => setForm({ ...form, stock: Number(e.target.value) })}
                  className={`${inputCls} max-w-[140px]`}
                />
              </Field>

              <Field label="Talles disponibles">
                <div className="flex flex-wrap gap-2">
                  {ALL_SIZES.map((s) => {
                    const checked = form.sizes.includes(s);
                    return (
                      <button
                        key={s}
                        type="button"
                        onClick={() =>
                          setForm({
                            ...form,
                            sizes: checked
                              ? form.sizes.filter((x) => x !== s)
                              : [...form.sizes, s],
                          })
                        }
                        className={`rounded-lg border px-3 py-1.5 font-mono text-xs font-bold uppercase tracking-wider transition-colors ${
                          checked
                            ? "border-thor-gold bg-thor-gold/15 text-thor-ink"
                            : "border-thor-line text-thor-muted hover:text-thor-ink"
                        }`}
                      >
                        {s}
                      </button>
                    );
                  })}
                </div>
                <p className="mt-1 text-[11px] text-thor-muted">
                  S a XXL vienen tildados por defecto. Sumá 3XL/4XL solo si tenés stock real de esos talles.
                </p>
              </Field>

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
