"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { getOrder, syncPayment, type OrderStatus } from "@/lib/orders";
import { useCart } from "@/lib/cart";

const VIEW: Record<string, { icon: string; title: string; text: string }> = {
  Paid: { icon: "✅", title: "¡Pago confirmado!", text: "Tu pedido está pago. Te enviamos el resumen y el seguimiento por email." },
  Pending: { icon: "⏳", title: "Pago pendiente", text: "Estamos esperando la confirmación del pago. Te avisamos apenas se acredite." },
  Cancelled: { icon: "❌", title: "Pago no completado", text: "El pago no se concretó. Podés intentar de nuevo cuando quieras." },
};

function Resultado() {
  const params = useSearchParams();
  const orderId = params.get("order");
  const paymentId = params.get("payment_id") ?? params.get("collection_id");
  const { clear } = useCart();

  const [order, setOrder] = useState<OrderStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      if (paymentId) {
        try { await syncPayment(paymentId); } catch { /* seguimos */ }
      }
      if (orderId) {
        try { setOrder(await getOrder(orderId)); } catch { /* seguimos */ }
      }
      clear(); // vaciar el carrito al volver del checkout
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId, paymentId]);

  if (loading) {
    return <p className="px-5 py-24 text-center text-thor-muted">Confirmando tu pago…</p>;
  }

  const view = (order && VIEW[order.status]) ?? VIEW.Pending;

  return (
    <div className="mx-auto max-w-lg px-5 py-20 text-center">
      <div className="text-5xl">{view.icon}</div>
      <h1 className="mt-4 font-display text-3xl tracking-wide text-thor-ink">{view.title}</h1>
      <p className="mt-3 text-thor-muted">{view.text}</p>
      {order && (
        <p className="mt-4 font-mono text-sm text-thor-muted">
          Pedido <strong className="text-thor-ink">{order.orderId}</strong> · Total{" "}
          <strong className="text-thor-ink">${order.total.toLocaleString("es-AR")}</strong>
        </p>
      )}
      <Link
        href="/camisetas"
        className="mt-8 inline-block rounded-xl bg-thor-gold px-6 py-3 font-mono text-sm font-bold uppercase tracking-wider text-thor-ink"
      >
        Seguir comprando
      </Link>
    </div>
  );
}

export default function ResultadoPage() {
  return (
    <Suspense fallback={<p className="px-5 py-24 text-center text-thor-muted">Cargando…</p>}>
      <Resultado />
    </Suspense>
  );
}
