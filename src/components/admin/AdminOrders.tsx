"use client";

import { useCallback, useEffect, useState } from "react";
import {
  adminListOrders,
  adminSetOrderStatus,
  adminSetOrderTotal,
  adminSetOrderTracking,
  type AdminOrder,
} from "@/lib/admin";

const STATUS = [
  { value: "Pending", label: "Pendiente" },
  { value: "Paid", label: "Pagado" },
  { value: "Delivered", label: "Entregado" },
  { value: "Cancelled", label: "Cancelado" },
];
const statusLabel = (s: string) => STATUS.find((x) => x.value === s)?.label ?? s;

/** Un pedido "Pendiente" que no se movió en más de 2 semanas se marca como estancado. */
const STALE_DAYS = 14;
function isStalled(o: AdminOrder): boolean {
  if (o.status !== "Pending") return false;
  const ageMs = Date.now() - new Date(o.createdAt).getTime();
  return ageMs > STALE_DAYS * 24 * 60 * 60 * 1000;
}

function detalle(o: AdminOrder): string {
  if (o.kind === "Custom") {
    return o.customItems
      .map(
        (c, i) =>
          `#${i + 1} ${c.reference} | Tela: ${c.fabric} | Talle: ${c.size}` +
          (c.patch ? ` | Parche: ${c.patch}` : "") +
          (c.number ? ` | N°: ${c.number}` : "") +
          (c.name ? ` | Nombre: ${c.name}` : "") +
          (c.referenceImageUrl ? ` | Foto: ${c.referenceImageUrl}` : ""),
      )
      .join("  ||  ");
  }
  return o.items
    .map((i) => {
      let line = `${i.productName} x${i.quantity} ($${i.unitPrice})`;
      if (i.size) line += ` | Talle: ${i.size}`;
      if (i.customName) line += ` | Nombre: ${i.customName}`;
      if (i.customNumber) line += ` | N°: ${i.customNumber}`;
      if (i.patchLabel) line += ` | Parche: ${i.patchLabel}`;
      return line;
    })
    .join("  ||  ");
}

function formatAddress(o: AdminOrder): string {
  const parts = [
    o.street,
    o.floor && `Piso ${o.floor}`,
    o.apartment && `Depto ${o.apartment}`,
    o.city,
    o.province,
    o.postalCode && `CP ${o.postalCode}`,
  ].filter(Boolean);
  return parts.join(", ");
}

function paymentLabel(o: AdminOrder): string {
  if (o.kind === "Custom") return "a coordinar";
  return o.paymentMethod === "Transfer" ? "Transferencia" : "Mercado Pago";
}

function exportCsv(orders: AdminOrder[]) {
  const headers = [
    "Fecha", "N° Pedido", "Tipo", "Estado", "Cliente", "Email",
    "Teléfono", "Dirección", "Especificaciones de entrega", "Notas",
    "Total", "Forma de pago", "Comprobante", "Seguimiento", "Detalle",
  ];
  const rows = orders.map((o) => [
    new Date(o.createdAt).toLocaleString("es-AR"),
    o.publicId,
    o.kind === "Custom" ? "Personalizado" : "Stock",
    statusLabel(o.status),
    o.customerName,
    o.customerEmail,
    o.customerPhone,
    formatAddress(o),
    o.deliveryNotes ?? "",
    o.notes ?? "",
    o.kind === "Custom" && o.total <= 0 ? "a coordinar" : String(o.total),
    paymentLabel(o),
    o.receiptUrl ?? "",
    o.trackingNumber ?? "",
    detalle(o),
  ]);
  const esc = (v: string) => `"${String(v).replace(/"/g, '""')}"`;
  const csv =
    "﻿" + [headers, ...rows].map((r) => r.map(esc).join(";")).join("\r\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `pedidos-thor-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function RemitoPrintable({ order: o }: { order: AdminOrder }) {
  return (
    <div className="p-10 text-black">
      <h1 className="text-2xl font-bold">Remito — Pedido #{o.publicId}</h1>
      <p className="mt-1 text-sm">
        {new Date(o.createdAt).toLocaleDateString("es-AR", {
          day: "numeric",
          month: "long",
          year: "numeric",
        })}
      </p>

      <div className="mt-6">
        <h2 className="text-sm font-bold uppercase">Cliente</h2>
        <p>{o.customerName}</p>
        <p>
          {o.customerPhone}
          {o.customerEmail ? ` · ${o.customerEmail}` : ""}
        </p>
      </div>

      <div className="mt-4">
        <h2 className="text-sm font-bold uppercase">Dirección de envío</h2>
        <p>{formatAddress(o)}</p>
        {o.deliveryNotes && <p className="italic">{o.deliveryNotes}</p>}
      </div>

      <div className="mt-6">
        <h2 className="text-sm font-bold uppercase">Detalle</h2>
        {o.kind === "Custom" ? (
          <ul className="mt-2 list-disc pl-5">
            {o.customItems.map((c, i) => (
              <li key={i}>
                {c.reference} — Tela: {c.fabric}, Talle: {c.size}
                {c.patch && `, Parche: ${c.patch}`}
                {c.number && `, N°: ${c.number}`}
                {c.name && `, Nombre: ${c.name}`}
              </li>
            ))}
          </ul>
        ) : (
          <table className="mt-2 w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-black text-left">
                <th className="py-1">Producto</th>
                <th className="py-1">Talle</th>
                <th className="py-1">Cant.</th>
                <th className="py-1 text-right">Precio</th>
              </tr>
            </thead>
            <tbody>
              {o.items.map((it, i) => (
                <tr key={i} className="border-b border-gray-300">
                  <td className="py-1">
                    {it.productName}
                    {it.customName && ` · ${it.customName}`}
                    {it.customNumber && ` #${it.customNumber}`}
                    {it.patchLabel && ` · ${it.patchLabel}`}
                  </td>
                  <td className="py-1">{it.size ?? "-"}</td>
                  <td className="py-1">{it.quantity}</td>
                  <td className="py-1 text-right">
                    ${(it.unitPrice * it.quantity).toLocaleString("es-AR")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {o.isGift ? (
        <div className="mt-6 rounded border border-black px-4 py-3 text-center">
          <p className="font-bold">🎁 Es un regalo</p>
          {o.giftMessage && <p className="mt-1 text-sm italic">&quot;{o.giftMessage}&quot;</p>}
        </div>
      ) : (
        <>
          <div className="mt-6 flex justify-between border-t border-black pt-3 text-lg font-bold">
            <span>Total</span>
            <span>
              {o.kind === "Custom" && o.total <= 0 ? "A coordinar" : `$${o.total.toLocaleString("es-AR")}`}
            </span>
          </div>
          <p className="mt-1 text-sm">Forma de pago: {paymentLabel(o)}</p>
        </>
      )}
    </div>
  );
}

export function AdminOrders() {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [editingTotal, setEditingTotal] = useState<Record<string, string>>({});
  const [savingTotal, setSavingTotal] = useState<string | null>(null);
  const [totalError, setTotalError] = useState("");
  const [editingTracking, setEditingTracking] = useState<Record<string, string>>({});
  const [savingTracking, setSavingTracking] = useState<string | null>(null);
  const [trackingError, setTrackingError] = useState("");
  const [printingOrder, setPrintingOrder] = useState<AdminOrder | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkStatus, setBulkStatus] = useState(STATUS[0].value);
  const [bulkRunning, setBulkRunning] = useState(false);
  const [bulkError, setBulkError] = useState("");
  const [onlyStalled, setOnlyStalled] = useState(false);

  useEffect(() => {
    if (!printingOrder) return;
    const t = setTimeout(() => window.print(), 50);
    const onAfterPrint = () => setPrintingOrder(null);
    window.addEventListener("afterprint", onAfterPrint);
    return () => {
      clearTimeout(t);
      window.removeEventListener("afterprint", onAfterPrint);
    };
  }, [printingOrder]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setOrders(await adminListOrders());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function changeStatus(publicId: string, status: string) {
    await adminSetOrderStatus(publicId, status);
    setOrders((prev) => prev.map((o) => (o.publicId === publicId ? { ...o, status } : o)));
  }

  function startEditTotal(o: AdminOrder) {
    setTotalError("");
    setEditingTotal((prev) => ({ ...prev, [o.publicId]: o.total > 0 ? String(o.total) : "" }));
  }

  function cancelEditTotal(publicId: string) {
    setEditingTotal((prev) => {
      const next = { ...prev };
      delete next[publicId];
      return next;
    });
  }

  async function saveTotal(publicId: string) {
    const raw = editingTotal[publicId];
    const value = Number(raw);
    if (!raw || !Number.isFinite(value) || value < 0) {
      setTotalError("Ingresá un precio válido.");
      return;
    }
    setTotalError("");
    setSavingTotal(publicId);
    try {
      await adminSetOrderTotal(publicId, value);
      setOrders((prev) => prev.map((o) => (o.publicId === publicId ? { ...o, total: value } : o)));
      cancelEditTotal(publicId);
    } catch (err) {
      setTotalError(err instanceof Error ? err.message : "No se pudo guardar el precio.");
    } finally {
      setSavingTotal(null);
    }
  }

  function startEditTracking(o: AdminOrder) {
    setTrackingError("");
    setEditingTracking((prev) => ({ ...prev, [o.publicId]: o.trackingNumber ?? "" }));
  }

  function cancelEditTracking(publicId: string) {
    setEditingTracking((prev) => {
      const next = { ...prev };
      delete next[publicId];
      return next;
    });
  }

  async function saveTracking(publicId: string) {
    const value = (editingTracking[publicId] ?? "").trim();
    setTrackingError("");
    setSavingTracking(publicId);
    try {
      await adminSetOrderTracking(publicId, value);
      setOrders((prev) =>
        prev.map((o) => (o.publicId === publicId ? { ...o, trackingNumber: value || null } : o)),
      );
      cancelEditTracking(publicId);
    } catch (err) {
      setTrackingError(err instanceof Error ? err.message : "No se pudo guardar el seguimiento.");
    } finally {
      setSavingTracking(null);
    }
  }

  const q = search.trim().toLowerCase();
  const filtered = orders.filter((o) => {
    if (statusFilter && o.status !== statusFilter) return false;
    if (onlyStalled && !isStalled(o)) return false;
    if (!q) return true;
    return (
      o.publicId.toLowerCase().includes(q) ||
      o.customerName.toLowerCase().includes(q) ||
      o.customerEmail.toLowerCase().includes(q) ||
      o.customerPhone.toLowerCase().includes(q)
    );
  });
  const stalledCount = orders.filter(isStalled).length;

  function toggleSelected(publicId: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(publicId)) next.delete(publicId);
      else next.add(publicId);
      return next;
    });
  }

  function toggleSelectAll() {
    setSelected((prev) =>
      prev.size === filtered.length ? new Set() : new Set(filtered.map((o) => o.publicId)),
    );
  }

  async function applyBulkStatus() {
    setBulkError("");
    setBulkRunning(true);
    const ids = Array.from(selected);
    const failed: string[] = [];
    for (const publicId of ids) {
      try {
        await adminSetOrderStatus(publicId, bulkStatus);
        setOrders((prev) => prev.map((o) => (o.publicId === publicId ? { ...o, status: bulkStatus } : o)));
      } catch {
        failed.push(publicId);
      }
    }
    setBulkRunning(false);
    setSelected(new Set());
    if (failed.length > 0) {
      setBulkError(`No se pudo actualizar: ${failed.join(", ")}.`);
    }
  }

  return (
    <>
    <div className="print:hidden">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-thor-muted">
          {filtered.length} de {orders.length} pedidos
        </p>
        <button
          onClick={() => exportCsv(filtered)}
          disabled={filtered.length === 0}
          className="rounded-lg bg-thor-land px-4 py-2 font-mono text-xs font-bold uppercase tracking-wider text-white disabled:opacity-50"
        >
          ↓ Exportar a Excel
        </button>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nombre, email, teléfono o N° de pedido…"
          className="min-w-[240px] flex-1 rounded-lg border border-thor-line bg-thor-paper px-3 py-2 text-sm text-thor-ink"
        />
        <div className="inline-flex flex-wrap gap-1 rounded-xl border border-thor-line bg-thor-paper p-1">
          <button
            onClick={() => setStatusFilter("")}
            className={`rounded-lg px-3 py-1.5 font-mono text-[11px] font-bold uppercase tracking-wider transition-colors ${
              statusFilter === "" ? "bg-thor-gold text-thor-ink" : "text-thor-muted hover:text-thor-ink"
            }`}
          >
            Todos
          </button>
          {STATUS.map((s) => (
            <button
              key={s.value}
              onClick={() => setStatusFilter(s.value)}
              className={`rounded-lg px-3 py-1.5 font-mono text-[11px] font-bold uppercase tracking-wider transition-colors ${
                statusFilter === s.value ? "bg-thor-gold text-thor-ink" : "text-thor-muted hover:text-thor-ink"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {stalledCount > 0 && (
        <button
          type="button"
          onClick={() => setOnlyStalled((v) => !v)}
          className={`mb-4 flex w-full items-center gap-2 rounded-xl border px-4 py-2.5 text-left text-sm ${
            onlyStalled
              ? "border-red-400 bg-red-50 text-red-700"
              : "border-red-300/60 bg-red-50/60 text-red-700 hover:bg-red-50"
          }`}
        >
          ⚠️ {stalledCount} pedido{stalledCount === 1 ? "" : "s"} pendiente
          {stalledCount === 1 ? "" : "s"} hace más de {STALE_DAYS} días sin moverse.
          <span className="ml-auto font-mono text-[11px] font-bold uppercase tracking-wider underline">
            {onlyStalled ? "Ver todos" : "Ver estancados"}
          </span>
        </button>
      )}

      {totalError && <p className="mb-3 text-sm text-red-600">{totalError}</p>}
      {trackingError && <p className="mb-3 text-sm text-red-600">{trackingError}</p>}
      {bulkError && <p className="mb-3 text-sm text-red-600">{bulkError}</p>}

      {selected.size > 0 && (
        <div className="mb-4 flex flex-wrap items-center gap-3 rounded-xl border border-thor-gold/40 bg-thor-gold/10 px-4 py-3">
          <span className="font-mono text-xs font-bold uppercase tracking-wide text-thor-ink">
            {selected.size} seleccionado{selected.size === 1 ? "" : "s"}
          </span>
          <select
            value={bulkStatus}
            onChange={(e) => setBulkStatus(e.target.value)}
            className="rounded-md border border-thor-line bg-thor-cream px-2 py-1.5 font-mono text-xs text-thor-ink"
          >
            {STATUS.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
          <button
            type="button"
            onClick={applyBulkStatus}
            disabled={bulkRunning}
            className="rounded-lg bg-thor-ink px-4 py-1.5 font-mono text-xs font-bold uppercase tracking-wider text-thor-cream disabled:opacity-60"
          >
            {bulkRunning ? "Aplicando…" : "Marcar como"}
          </button>
          <button
            type="button"
            onClick={() => setSelected(new Set())}
            className="font-mono text-xs text-thor-muted underline hover:text-thor-ink"
          >
            Cancelar selección
          </button>
        </div>
      )}

      <div className="overflow-x-auto rounded-2xl border border-thor-line bg-thor-paper">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-thor-line text-left font-mono text-[11px] uppercase tracking-wide text-thor-muted">
              <th className="px-4 py-3">
                <input
                  type="checkbox"
                  checked={filtered.length > 0 && selected.size === filtered.length}
                  onChange={toggleSelectAll}
                  aria-label="Seleccionar todos"
                />
              </th>
              <th className="px-4 py-3">Fecha</th>
              <th className="px-4 py-3">Pedido</th>
              <th className="px-4 py-3">Tipo</th>
              <th className="px-4 py-3">Cliente</th>
              <th className="px-4 py-3">Dirección</th>
              <th className="px-4 py-3">Total</th>
              <th className="px-4 py-3">Pago</th>
              <th className="px-4 py-3">Seguimiento</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3">Remito</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={10} className="px-4 py-8 text-center text-thor-muted">Cargando…</td>
              </tr>
            )}
            {!loading && orders.length > 0 && filtered.length === 0 && (
              <tr>
                <td colSpan={10} className="px-4 py-8 text-center text-thor-muted">
                  Ningún pedido coincide con la búsqueda o el filtro.
                </td>
              </tr>
            )}
            {!loading && orders.length === 0 && (
              <tr>
                <td colSpan={10} className="px-4 py-8 text-center text-thor-muted">
                  Todavía no hay pedidos.
                </td>
              </tr>
            )}
            {!loading &&
              filtered.map((o) => (
                <tr
                  key={o.publicId}
                  className={`border-b border-thor-line align-top last:border-0 ${
                    isStalled(o) ? "bg-red-50" : ""
                  }`}
                >
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selected.has(o.publicId)}
                      onChange={() => toggleSelected(o.publicId)}
                      aria-label={`Seleccionar pedido ${o.publicId}`}
                    />
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-thor-muted">
                    {new Date(o.createdAt).toLocaleDateString("es-AR")}
                    {isStalled(o) && (
                      <span className="mt-1 block font-mono text-[10px] font-bold uppercase text-red-600">
                        ⚠ Estancado
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-mono text-xs text-thor-ink">{o.publicId}</span>
                    <span className="mt-1 block max-w-xs text-[11px] text-thor-muted">
                      {detalle(o)}
                    </span>
                    {o.kind === "Custom" &&
                      o.customItems.some((c) => c.referenceImageUrl) && (
                        <span className="mt-1 flex flex-wrap gap-1">
                          {o.customItems.map(
                            (c, i) =>
                              c.referenceImageUrl && (
                                <a
                                  key={i}
                                  href={c.referenceImageUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-[11px] text-thor-gold underline"
                                >
                                  Foto #{i + 1}
                                </a>
                              ),
                          )}
                        </span>
                      )}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 font-mono text-[10px] uppercase ${
                        o.kind === "Custom"
                          ? "bg-thor-sky/15 text-thor-sky"
                          : "bg-thor-gold/15 text-thor-gold"
                      }`}
                    >
                      {o.kind === "Custom" ? "Personalizado" : "Stock"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="block font-semibold text-thor-ink">
                      {o.customerName}
                      {o.isGift && (
                        <span
                          title={o.giftMessage ? `Regalo: ${o.giftMessage}` : "Es un regalo"}
                          className="ml-1.5"
                        >
                          🎁
                        </span>
                      )}
                    </span>
                    <span className="block text-[11px] text-thor-muted">{o.customerPhone}</span>
                  </td>
                  <td className="max-w-[220px] px-4 py-3 text-[11px] text-thor-muted">
                    {formatAddress(o)}
                    {o.deliveryNotes && (
                      <span className="mt-0.5 block italic">{o.deliveryNotes}</span>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 font-mono tabular-nums text-thor-ink">
                    {o.kind === "Custom" ? (
                      editingTotal[o.publicId] !== undefined ? (
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            min={0}
                            autoFocus
                            value={editingTotal[o.publicId]}
                            onChange={(e) =>
                              setEditingTotal((prev) => ({ ...prev, [o.publicId]: e.target.value }))
                            }
                            className="w-24 rounded-md border border-thor-line bg-thor-cream px-2 py-1 text-xs"
                          />
                          <button
                            type="button"
                            onClick={() => saveTotal(o.publicId)}
                            disabled={savingTotal === o.publicId}
                            aria-label="Guardar precio"
                            className="text-thor-gold hover:underline disabled:opacity-50"
                          >
                            ✓
                          </button>
                          <button
                            type="button"
                            onClick={() => cancelEditTotal(o.publicId)}
                            aria-label="Cancelar"
                            className="text-thor-muted hover:underline"
                          >
                            ✕
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span>{o.total > 0 ? `$${o.total.toLocaleString("es-AR")}` : "a coordinar"}</span>
                          <button
                            type="button"
                            onClick={() => startEditTotal(o)}
                            className="font-mono text-[11px] font-normal normal-case text-thor-gold underline"
                          >
                            {o.total > 0 ? "Editar" : "Poner precio"}
                          </button>
                        </div>
                      )
                    ) : (
                      `$${o.total.toLocaleString("es-AR")}`
                    )}
                  </td>
                  <td className="px-4 py-3 text-[11px]">
                    <span className="block text-thor-ink">{paymentLabel(o)}</span>
                    {o.receiptUrl && (
                      <a
                        href={o.receiptUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-thor-gold underline"
                      >
                        Ver comprobante
                      </a>
                    )}
                  </td>
                  <td className="px-4 py-3 text-[11px]">
                    {editingTracking[o.publicId] !== undefined ? (
                      <div className="flex items-center gap-1">
                        <input
                          type="text"
                          autoFocus
                          value={editingTracking[o.publicId]}
                          onChange={(e) =>
                            setEditingTracking((prev) => ({ ...prev, [o.publicId]: e.target.value }))
                          }
                          placeholder="Código de seguimiento"
                          className="w-28 rounded-md border border-thor-line bg-thor-cream px-2 py-1 text-xs"
                        />
                        <button
                          type="button"
                          onClick={() => saveTracking(o.publicId)}
                          disabled={savingTracking === o.publicId}
                          aria-label="Guardar seguimiento"
                          className="text-thor-gold hover:underline disabled:opacity-50"
                        >
                          ✓
                        </button>
                        <button
                          type="button"
                          onClick={() => cancelEditTracking(o.publicId)}
                          aria-label="Cancelar"
                          className="text-thor-muted hover:underline"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-thor-ink">{o.trackingNumber ?? "—"}</span>
                        <button
                          type="button"
                          onClick={() => startEditTracking(o)}
                          className="font-mono text-[11px] font-normal normal-case text-thor-gold underline"
                        >
                          {o.trackingNumber ? "Editar" : "Cargar"}
                        </button>
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={o.status}
                      onChange={(e) => changeStatus(o.publicId, e.target.value)}
                      className="rounded-md border border-thor-line bg-thor-cream px-2 py-1 font-mono text-xs text-thor-ink"
                    >
                      {STATUS.map((s) => (
                        <option key={s.value} value={s.value}>{s.label}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => setPrintingOrder(o)}
                      className="rounded-md border border-thor-line px-2.5 py-1 font-mono text-xs text-thor-ink hover:border-thor-gold"
                    >
                      🖨 Imprimir
                    </button>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
    {printingOrder && (
      <div className="hidden print:block">
        <RemitoPrintable order={printingOrder} />
      </div>
    )}
    </>
  );
}
