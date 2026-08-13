"use client";

import { useEffect, useState } from "react";
import { adminListOrders, type AdminOrder } from "@/lib/admin";

const MONTHS_BACK = 6;
const STATUS_LABELS: [string, string][] = [
  ["Pending", "Pendiente"],
  ["Paid", "Pagado"],
  ["Delivered", "Entregado"],
  ["Cancelled", "Cancelado"],
];

function monthKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}
function monthLabel(key: string) {
  const [y, m] = key.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("es-AR", { month: "short", year: "2-digit" });
}

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-thor-line bg-thor-paper p-4">
      <p className="font-mono text-[11px] uppercase tracking-wide text-thor-muted">{label}</p>
      <p className="mt-1 font-display text-2xl text-thor-ink">{value}</p>
    </div>
  );
}

export function AdminStats() {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminListOrders()
      .then(setOrders)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="mt-6 text-sm text-thor-muted">Cargando estadísticas…</p>;
  if (orders.length === 0)
    return (
      <div className="mt-6 rounded-2xl border border-dashed border-thor-line bg-thor-paper p-10 text-center">
        <p className="text-sm text-thor-muted">Todavía no hay pedidos para mostrar estadísticas.</p>
      </div>
    );

  const facturados = orders.filter(
    (o) => o.kind === "Stock" && (o.status === "Paid" || o.status === "Delivered"),
  );
  const totalFacturado = facturados.reduce((sum, o) => sum + o.total, 0);
  const ticketPromedio = facturados.length > 0 ? totalFacturado / facturados.length : 0;

  const counts: Record<string, number> = {};
  orders.forEach((o) => {
    counts[o.status] = (counts[o.status] ?? 0) + 1;
  });

  // Ventas de los últimos MONTHS_BACK meses.
  const now = new Date();
  const months: string[] = [];
  for (let i = MONTHS_BACK - 1; i >= 0; i--) {
    months.push(monthKey(new Date(now.getFullYear(), now.getMonth() - i, 1)));
  }
  const salesByMonth = new Map<string, number>(months.map((m) => [m, 0]));
  facturados.forEach((o) => {
    const key = monthKey(new Date(o.createdAt));
    if (salesByMonth.has(key)) salesByMonth.set(key, (salesByMonth.get(key) ?? 0) + o.total);
  });
  const maxMonthly = Math.max(1, ...Array.from(salesByMonth.values()));

  // Productos más pedidos (de pedidos de catálogo no cancelados).
  const productCounts = new Map<string, number>();
  orders
    .filter((o) => o.kind === "Stock" && o.status !== "Cancelled")
    .forEach((o) => {
      o.items.forEach((it) => {
        productCounts.set(it.productName, (productCounts.get(it.productName) ?? 0) + it.quantity);
      });
    });
  const topProducts = Array.from(productCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);
  const maxProductQty = Math.max(1, ...topProducts.map(([, qty]) => qty));

  return (
    <div className="mt-6 flex flex-col gap-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi label="Total facturado" value={`$${totalFacturado.toLocaleString("es-AR")}`} />
        <Kpi label="Pedidos totales" value={String(orders.length)} />
        <Kpi label="Ticket promedio" value={`$${Math.round(ticketPromedio).toLocaleString("es-AR")}`} />
        <Kpi label="Pendientes" value={String(counts.Pending ?? 0)} />
      </div>

      <div className="rounded-2xl border border-thor-line bg-thor-paper p-5">
        <h3 className="font-mono text-xs font-bold uppercase tracking-wide text-thor-muted">
          Pedidos por estado
        </h3>
        <div className="mt-3 flex flex-wrap gap-3">
          {STATUS_LABELS.map(([key, label]) => (
            <span
              key={key}
              className="rounded-lg border border-thor-line px-3 py-1.5 font-mono text-xs text-thor-ink"
            >
              {label}: <strong>{counts[key] ?? 0}</strong>
            </span>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-thor-line bg-thor-paper p-5">
        <h3 className="font-mono text-xs font-bold uppercase tracking-wide text-thor-muted">
          Ventas de los últimos {MONTHS_BACK} meses
        </h3>
        <p className="mt-1 text-xs text-thor-muted">Solo pedidos de catálogo pagados o entregados.</p>
        <div className="mt-4 flex items-end gap-3" style={{ height: 140 }}>
          {months.map((m) => {
            const val = salesByMonth.get(m) ?? 0;
            const h = Math.max(4, Math.round((val / maxMonthly) * 120));
            return (
              <div key={m} className="flex flex-1 flex-col items-center gap-1">
                <span className="font-mono text-[10px] text-thor-muted">
                  {val > 0 ? `$${val.toLocaleString("es-AR")}` : ""}
                </span>
                <div className="w-full rounded-t-md bg-thor-gold" style={{ height: h }} />
                <span className="font-mono text-[10px] uppercase text-thor-muted">{monthLabel(m)}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="rounded-2xl border border-thor-line bg-thor-paper p-5">
        <h3 className="font-mono text-xs font-bold uppercase tracking-wide text-thor-muted">
          Productos más pedidos
        </h3>
        {topProducts.length === 0 ? (
          <p className="mt-3 text-sm text-thor-muted">Todavía no hay pedidos de catálogo.</p>
        ) : (
          <div className="mt-3 flex flex-col gap-2">
            {topProducts.map(([name, qty]) => (
              <div key={name} className="flex items-center gap-3">
                <span className="w-40 shrink-0 truncate text-sm text-thor-ink" title={name}>
                  {name}
                </span>
                <div className="h-2.5 flex-1 rounded-full bg-thor-cream-2">
                  <div
                    className="h-2.5 rounded-full bg-thor-sky"
                    style={{ width: `${(qty / maxProductQty) * 100}%` }}
                  />
                </div>
                <span className="w-8 text-right font-mono text-xs text-thor-muted">{qty}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
