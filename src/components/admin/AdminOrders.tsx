"use client";

import { useCallback, useEffect, useState } from "react";
import {
  adminListOrders,
  adminSetOrderStatus,
  type AdminOrder,
} from "@/lib/admin";

const STATUS = [
  { value: "Pending", label: "Pendiente" },
  { value: "Paid", label: "Pagado" },
  { value: "Delivered", label: "Entregado" },
  { value: "Cancelled", label: "Cancelado" },
];
const statusLabel = (s: string) => STATUS.find((x) => x.value === s)?.label ?? s;

function detalle(o: AdminOrder): string {
  if (o.kind === "Custom") {
    return o.customItems
      .map(
        (c, i) =>
          `#${i + 1} ${c.reference} | Tela: ${c.fabric} | Talle: ${c.size}` +
          (c.patch ? ` | Parche: ${c.patch}` : "") +
          (c.number ? ` | N°: ${c.number}` : "") +
          (c.name ? ` | Nombre: ${c.name}` : ""),
      )
      .join("  ||  ");
  }
  return o.items
    .map((i) => {
      let line = `${i.productName} x${i.quantity} ($${i.unitPrice})`;
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
    "Total", "Forma de pago", "Comprobante", "Detalle",
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
    o.kind === "Custom" ? "a coordinar" : String(o.total),
    paymentLabel(o),
    o.receiptUrl ?? "",
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

export function AdminOrders() {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

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

  const q = search.trim().toLowerCase();
  const filtered = orders.filter((o) => {
    if (statusFilter && o.status !== statusFilter) return false;
    if (!q) return true;
    return (
      o.publicId.toLowerCase().includes(q) ||
      o.customerName.toLowerCase().includes(q) ||
      o.customerEmail.toLowerCase().includes(q) ||
      o.customerPhone.toLowerCase().includes(q)
    );
  });

  return (
    <div>
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

      <div className="overflow-x-auto rounded-2xl border border-thor-line bg-thor-paper">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-thor-line text-left font-mono text-[11px] uppercase tracking-wide text-thor-muted">
              <th className="px-4 py-3">Fecha</th>
              <th className="px-4 py-3">Pedido</th>
              <th className="px-4 py-3">Tipo</th>
              <th className="px-4 py-3">Cliente</th>
              <th className="px-4 py-3">Dirección</th>
              <th className="px-4 py-3">Total</th>
              <th className="px-4 py-3">Pago</th>
              <th className="px-4 py-3">Estado</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-thor-muted">Cargando…</td>
              </tr>
            )}
            {!loading && orders.length > 0 && filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-thor-muted">
                  Ningún pedido coincide con la búsqueda o el filtro.
                </td>
              </tr>
            )}
            {!loading && orders.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-thor-muted">
                  Todavía no hay pedidos.
                </td>
              </tr>
            )}
            {!loading &&
              filtered.map((o) => (
                <tr key={o.publicId} className="border-b border-thor-line align-top last:border-0">
                  <td className="whitespace-nowrap px-4 py-3 text-thor-muted">
                    {new Date(o.createdAt).toLocaleDateString("es-AR")}
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-mono text-xs text-thor-ink">{o.publicId}</span>
                    <span className="mt-1 block max-w-xs text-[11px] text-thor-muted">
                      {detalle(o)}
                    </span>
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
                    <span className="block font-semibold text-thor-ink">{o.customerName}</span>
                    <span className="block text-[11px] text-thor-muted">{o.customerPhone}</span>
                  </td>
                  <td className="max-w-[220px] px-4 py-3 text-[11px] text-thor-muted">
                    {formatAddress(o)}
                    {o.deliveryNotes && (
                      <span className="mt-0.5 block italic">{o.deliveryNotes}</span>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 font-mono tabular-nums text-thor-ink">
                    {o.kind === "Custom" ? "a coordinar" : `$${o.total.toLocaleString("es-AR")}`}
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
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
