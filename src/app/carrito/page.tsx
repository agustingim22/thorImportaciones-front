"use client";

import { useState } from "react";
import Link from "next/link";
import { useCart } from "@/lib/cart";
import { createOrder, uploadReceipt, type CreateOrderResult } from "@/lib/orders";
import { isValidPhone, PHONE_HINT } from "@/lib/validation";
import { SITE, whatsappUrl } from "@/lib/site";
import { AddressFields, Field, emptyAddress, inputCls } from "@/components/AddressFields";

export default function CarritoPage() {
  const { items, total, setQty, remove, clear } = useCart();
  const [contact, setContact] = useState({ customerName: "", customerEmail: "", customerPhone: "" });
  const [address, setAddress] = useState(emptyAddress);
  const [paymentMethod, setPaymentMethod] = useState<"MercadoPago" | "Transfer">("MercadoPago");
  const [phoneError, setPhoneError] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<CreateOrderResult | null>(null);

  async function handleCheckout(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setPhoneError("");
    if (!isValidPhone(contact.customerPhone)) {
      setPhoneError(PHONE_HINT);
      return;
    }
    setLoading(true);
    try {
      const res = await createOrder({
        ...contact,
        ...address,
        paymentMethod,
        items: items.map((i) => ({ productId: i.productId, quantity: i.qty })),
      });
      if (res.checkoutUrl) {
        window.location.href = res.checkoutUrl; // redirige a Mercado Pago
        return;
      }
      clear();
      setResult(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo crear el pedido.");
    } finally {
      setLoading(false);
    }
  }

  if (result?.paymentMethod === "Transfer") {
    return <TransferResult orderId={result.orderId} total={result.total} />;
  }

  if (result) {
    return (
      <div className="mx-auto max-w-lg px-5 py-20 text-center">
        <div className="text-4xl">📦</div>
        <h1 className="mt-4 font-display text-3xl tracking-wide text-thor-ink">¡Pedido registrado!</h1>
        <p className="mt-3 text-thor-muted">
          Tu número de pedido es <strong className="font-mono text-thor-ink">{result.orderId}</strong>. Te
          contactamos para coordinar el pago.
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
        <h1 className="mt-4 font-display text-3xl tracking-wide text-thor-ink">Tu carrito está vacío</h1>
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
                <p className="font-mono text-sm text-thor-gold">${i.price.toLocaleString("es-AR")}</p>
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
            <span className="font-mono text-sm uppercase tracking-wide text-thor-muted">Total</span>
            <span className="font-display text-2xl text-thor-ink">${total.toLocaleString("es-AR")}</span>
          </div>

          <div className="mt-5 grid gap-3">
            <Field label="Nombre y apellido">
              <input
                required
                value={contact.customerName}
                onChange={(e) => setContact({ ...contact, customerName: e.target.value })}
                className={inputCls}
              />
            </Field>
            <Field label="Email">
              <input
                required
                type="email"
                value={contact.customerEmail}
                onChange={(e) => setContact({ ...contact, customerEmail: e.target.value })}
                className={inputCls}
              />
            </Field>
            <Field label="Teléfono / WhatsApp">
              <input
                required
                type="tel"
                value={contact.customerPhone}
                onChange={(e) => setContact({ ...contact, customerPhone: e.target.value })}
                placeholder="+54 9 11 ...."
                className={inputCls}
              />
              {phoneError && <p className="mt-1 text-xs text-red-600">{phoneError}</p>}
            </Field>
          </div>

          <h3 className="mt-6 font-mono text-xs font-bold uppercase tracking-wide text-thor-ink">
            Dirección de envío
          </h3>
          <div className="mt-3">
            <AddressFields value={address} onChange={setAddress} />
          </div>

          <h3 className="mt-6 font-mono text-xs font-bold uppercase tracking-wide text-thor-ink">
            Forma de pago
          </h3>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <PaymentOption
              label="Mercado Pago"
              active={paymentMethod === "MercadoPago"}
              onClick={() => setPaymentMethod("MercadoPago")}
            />
            <PaymentOption
              label="Transferencia"
              active={paymentMethod === "Transfer"}
              onClick={() => setPaymentMethod("Transfer")}
            />
          </div>

          {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="mt-5 w-full rounded-xl bg-thor-gold px-6 py-3 font-mono text-sm font-bold uppercase tracking-wider text-thor-ink transition-transform hover:-translate-y-0.5 disabled:opacity-60"
          >
            {loading
              ? "Procesando…"
              : paymentMethod === "MercadoPago"
                ? "Pagar con Mercado Pago"
                : "Confirmar pedido"}
          </button>
          <p className="mt-3 text-center font-mono text-[11px] text-thor-muted">
            El precio se confirma en el servidor.
          </p>
        </form>
      </div>
    </div>
  );
}

function PaymentOption({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-lg border px-4 py-2.5 font-mono text-xs font-bold uppercase tracking-wider transition-colors ${
        active
          ? "border-thor-gold bg-thor-gold/15 text-thor-ink"
          : "border-thor-line text-thor-muted hover:text-thor-ink"
      }`}
    >
      {label}
    </button>
  );
}

function TransferResult({ orderId, total }: { orderId: string; total: number }) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploaded, setUploaded] = useState(false);
  const [uploadError, setUploadError] = useState("");

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setUploadError("");
    setUploading(true);
    try {
      await uploadReceipt(orderId, f);
      setUploaded(true);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "No se pudo subir el comprobante.");
    } finally {
      setUploading(false);
    }
  }

  const waMsg = `¡Hola Thor! Hice el pedido #${orderId} por transferencia ($${total.toLocaleString(
    "es-AR",
  )}). Te paso el comprobante.`;

  return (
    <div className="mx-auto max-w-lg px-5 py-16">
      <div className="text-center">
        <div className="text-4xl">🏦</div>
        <h1 className="mt-4 font-display text-3xl tracking-wide text-thor-ink">Pedido registrado</h1>
        <p className="mt-3 text-thor-muted">
          Tu número de pedido es <strong className="font-mono text-thor-ink">{orderId}</strong>. Transferí{" "}
          <strong className="text-thor-ink">${total.toLocaleString("es-AR")}</strong> y subí el comprobante,
          o mandalo por WhatsApp.
        </p>
      </div>

      <div className="mt-8 rounded-2xl border border-thor-line bg-thor-paper p-5">
        <h2 className="font-mono text-xs font-bold uppercase tracking-wide text-thor-gold">
          Datos para transferir
        </h2>
        <dl className="mt-3 space-y-2 text-sm">
          {SITE.bank.cvu && (
            <div className="flex justify-between gap-3">
              <dt className="text-thor-muted">CVU</dt>
              <dd className="font-mono text-thor-ink">{SITE.bank.cvu}</dd>
            </div>
          )}
          <div className="flex justify-between gap-3">
            <dt className="text-thor-muted">Alias</dt>
            <dd className="font-mono text-thor-ink">{SITE.bank.alias}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-thor-muted">Titular</dt>
            <dd className="text-thor-ink">{SITE.bank.holder}</dd>
          </div>
        </dl>
      </div>

      <div className="mt-6 rounded-2xl border border-dashed border-thor-line bg-thor-cream-2 p-5 text-center">
        {uploaded ? (
          <p className="font-semibold text-thor-land">✓ Comprobante recibido. ¡Gracias!</p>
        ) : (
          <>
            <label className="inline-block cursor-pointer rounded-lg border border-thor-line bg-thor-paper px-4 py-2.5 font-mono text-xs font-bold uppercase tracking-wider text-thor-ink hover:border-thor-gold">
              {uploading ? "Subiendo…" : "Subir comprobante"}
              <input
                type="file"
                accept="image/*,application/pdf"
                className="hidden"
                onChange={handleUpload}
                disabled={uploading}
              />
            </label>
            {file && !uploading && !uploadError && (
              <p className="mt-2 text-xs text-thor-muted">{file.name}</p>
            )}
            {uploadError && <p className="mt-2 text-xs text-red-600">{uploadError}</p>}
          </>
        )}
        <p className="mt-4 text-xs text-thor-muted">
          O si preferís,{" "}
          <a
            href={whatsappUrl(waMsg)}
            target="_blank"
            rel="noopener noreferrer"
            className="text-thor-gold underline"
          >
            mandalo por WhatsApp
          </a>
          .
        </p>
      </div>

      <Link
        href="/camisetas"
        className="mt-8 block text-center font-mono text-xs uppercase tracking-wider text-thor-muted underline"
      >
        Seguir viendo camisetas
      </Link>
    </div>
  );
}
