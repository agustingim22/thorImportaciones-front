"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { getOrder, type OrderStatus } from "@/lib/orders";
import { PageHeader } from "@/components/PageHeader";

const STATUS_LABEL: Record<string, string> = {
  Pending: "Pendiente",
  Paid: "Pagado",
  Delivered: "Entregado",
  Cancelled: "Cancelado",
};
const STATUS_COLOR: Record<string, string> = {
  Pending: "bg-thor-gold/15 text-thor-gold",
  Paid: "bg-thor-land/15 text-thor-land",
  Delivered: "bg-thor-sky/15 text-thor-sky",
  Cancelled: "bg-red-500/10 text-red-600",
};

function Buscador() {
  const params = useSearchParams();
  const [id, setId] = useState(params.get("id") ?? "");
  const [order, setOrder] = useState<OrderStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searched, setSearched] = useState(false);

  async function handleSearch(searchId: string) {
    if (!searchId.trim()) return;
    setLoading(true);
    setError("");
    setSearched(true);
    try {
      setOrder(await getOrder(searchId.trim()));
    } catch {
      setOrder(null);
      setError("No encontramos ningún pedido con ese número. Revisá que esté completo.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const initial = params.get("id");
    if (initial) handleSearch(initial);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="mx-auto max-w-lg px-5 py-12">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSearch(id);
        }}
        className="flex gap-2"
      >
        <input
          value={id}
          onChange={(e) => setId(e.target.value)}
          placeholder="Número de pedido"
          className="w-full rounded-lg border border-thor-line bg-thor-paper px-3 py-2.5 font-mono text-sm text-thor-ink"
        />
        <button
          type="submit"
          disabled={loading}
          className="shrink-0 rounded-lg bg-thor-gold px-5 py-2.5 font-mono text-xs font-bold uppercase tracking-wider text-thor-ink disabled:opacity-60"
        >
          {loading ? "Buscando…" : "Buscar"}
        </button>
      </form>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      {order && (
        <div className="mt-8 rounded-2xl border border-thor-line bg-thor-paper p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="font-mono text-sm text-thor-ink">
              Pedido <strong>#{order.orderId}</strong>
            </p>
            <span
              className={`rounded-full px-3 py-1 font-mono text-xs font-bold uppercase tracking-wide ${
                STATUS_COLOR[order.status] ?? "bg-thor-line/40 text-thor-muted"
              }`}
            >
              {STATUS_LABEL[order.status] ?? order.status}
            </span>
          </div>
          <p className="mt-1 text-xs text-thor-muted">
            {new Date(order.createdAt).toLocaleDateString("es-AR", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>

          {order.items.length > 0 && (
            <ul className="mt-5 flex flex-col gap-2 border-t border-thor-line pt-4">
              {order.items.map((it, i) => (
                <li key={i} className="flex justify-between text-sm text-thor-ink-soft">
                  <span>
                    {it.productName} x{it.quantity}
                  </span>
                  <span className="tabular-nums">
                    ${(it.unitPrice * it.quantity).toLocaleString("es-AR")}
                  </span>
                </li>
              ))}
            </ul>
          )}

          {order.total > 0 && (
            <p className="mt-4 flex justify-between border-t border-thor-line pt-4 font-display text-lg text-thor-ink">
              <span>Total</span>
              <span className="text-thor-gold">${order.total.toLocaleString("es-AR")}</span>
            </p>
          )}
        </div>
      )}

      {searched && !loading && !order && !error && (
        <p className="mt-4 text-sm text-thor-muted">Sin resultados.</p>
      )}

      <p className="mt-8 text-center text-xs text-thor-muted">
        ¿Tenés dudas sobre tu pedido?{" "}
        <Link href="/contacto" className="text-thor-gold underline">
          Escribinos
        </Link>
        .
      </p>
    </div>
  );
}

export function PedidoTracker() {
  return (
    <>
      <PageHeader
        eyebrow="Seguimiento"
        title="Tu pedido"
        subtitle="Ingresá el número de pedido que te enviamos por email o WhatsApp para ver su estado."
      />
      <Suspense fallback={<p className="px-5 py-16 text-center text-thor-muted">Cargando…</p>}>
        <Buscador />
      </Suspense>
    </>
  );
}
