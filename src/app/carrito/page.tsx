"use client";

import { useState } from "react";
import Link from "next/link";
import { useCart } from "@/lib/cart";
import { createOrder } from "@/lib/orders";

export default function CarritoPage() {
  const { items, total, setQty, remove, clear } = useCart();
  const [form, setForm] = useState({
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    shippingAddress: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState<string | null>(null);

  async function handleCheckout(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const result = await createOrder({
        ...form,
        items: items.map((i) => ({ productId: i.productId, quantity: i.qty })),
      });
      if (result.checkoutUrl) {
        // Redirige a Mercado Pago
        window.location.href = result.checkoutUrl;
      } else {
        // MP todavía no configurado: el pedido queda registrado
        clear();
        setDone(result.orderId);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo crear el pedido.");
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="mx-auto max-w-lg px-5 py-20 text-center">
        <div className="text-4xl">📦</div>
        <h1 className="mt-4 font-display text-3xl tracking-wide text-thor-ink">
          ¡Pedido registrado!
        </h1>
        <p className="mt-3 text-thor-muted">
          Tu número de pedido es{" "}
          <strong className="font-mono text-thor-ink">{done}</strong>. El pago
          online se activa apenas terminemos de configurar Mercado Pago; mientras
          tanto te contactamos para coordinar.
        </p>
        <Link
          href="/camisetas"
          className="mt-8 inline-block rounded-xl bg-thor-gold px-6 py-3 font-mono text-sm font-bold uppercase tracking-wider text-thor-ink"
        >
          Seguir viendo camisetas
        </Link>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-lg px-5 py-20 text-center">
        <div className="text-4xl">🛒</div>
        <h1 className="mt-4 font-display text-3xl tracking-wide text-thor-ink">
          Tu carrito está vacío
        </h1>
        <p className="mt-3 text-thor-muted">Sumá camisetas del catálogo para comprar.</p>
        <Link
          href="/camisetas"
          className="mt-8 inline-block rounded-xl bg-thor-gold px-6 py-3 font-mono text-sm font-bold uppercase tracking-wider text-thor-ink"
        >
          Ver catálogo
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-5 py-12">
      <h1 className="font-display text-4xl tracking-wide text-thor-ink">Tu carrito</h1>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1.4fr_1fr]">
        {/* Ítems */}
        <div className="flex flex-col gap-3">
          {items.map((i) => (
            <div
              key={i.productId}
              className="flex items-center gap-4 rounded-2xl border border-thor-line bg-thor-paper p-4"
            >
              <div
                className="jersey-shape grid h-16 w-14 shrink-0 place-items-center font-display text-xl text-thor-ink/80"
                style={{ background: i.colorCss }}
              >
                {i.number}
              </div>
              <div className="flex-1">
                <p className="font-body font-extrabold text-thor-ink">{i.team}</p>
                <p className="font-mono text-sm text-thor-gold">
                  ${i.price.toLocaleString("es-AR")}
                </p>
                <div className="mt-2 flex items-center gap-2">
                  <button
                    onClick={() => setQty(i.productId, i.qty - 1)}
                    className="grid h-7 w-7 place-items-center rounded-md border border-thor-line text-thor-ink"
                    aria-label="Restar"
                  >
                    −
                  </button>
                  <span className="w-6 text-center tabular-nums">{i.qty}</span>
                  <button
                    onClick={() => setQty(i.productId, i.qty + 1)}
                    className="grid h-7 w-7 place-items-center rounded-md border border-thor-line text-thor-ink"
                    aria-label="Sumar"
                  >
                    +
                  </button>
                  <button
                    onClick={() => remove(i.productId)}
                    className="ml-3 font-mono text-xs text-thor-muted underline hover:text-red-600"
                  >
                    Quitar
                  </button>
                </div>
              </div>
              <div className="font-mono font-bold tabular-nums text-thor-ink">
                ${(i.price * i.qty).toLocaleString("es-AR")}
              </div>
            </div>
          ))}
        </div>

        {/* Checkout */}
        <form
          onSubmit={handleCheckout}
          className="h-fit rounded-2xl border border-thor-line bg-thor-paper p-6"
        >
          <div className="flex items-center justify-between">
            <span className="font-mono text-sm uppercase tracking-wide text-thor-muted">
              Total
            </span>
            <span className="font-display text-2xl text-thor-ink">
              ${total.toLocaleString("es-AR")}
            </span>
          </div>

          <div className="mt-5 grid gap-3">
            <Input label="Nombre y apellido" value={form.customerName}
              onChange={(v) => setForm({ ...form, customerName: v })} />
            <Input label="Email" type="email" value={form.customerEmail}
              onChange={(v) => setForm({ ...form, customerEmail: v })} />
            <Input label="Teléfono / WhatsApp" type="tel" value={form.customerPhone}
              onChange={(v) => setForm({ ...form, customerPhone: v })} />
            <Input label="Dirección de envío" value={form.shippingAddress}
              onChange={(v) => setForm({ ...form, shippingAddress: v })} />
          </div>

          {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="mt-5 w-full rounded-xl bg-thor-gold px-6 py-3 font-mono text-sm font-bold uppercase tracking-wider text-thor-ink transition-transform hover:-translate-y-0.5 disabled:opacity-60"
          >
            {loading ? "Procesando…" : "Pagar con Mercado Pago"}
          </button>
          <p className="mt-3 text-center font-mono text-[11px] text-thor-muted">
            Pago seguro. El precio se confirma en el servidor.
          </p>
        </form>
      </div>
    </div>
  );
}

function Input({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1 block font-mono text-[11px] uppercase tracking-wide text-thor-muted">
        {label}
      </span>
      <input
        required
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-thor-line bg-thor-cream px-3 py-2 text-thor-ink"
      />
    </label>
  );
}
