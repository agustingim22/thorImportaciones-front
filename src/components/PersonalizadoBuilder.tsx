"use client";

import { useState } from "react";
import Link from "next/link";
import { createCustomOrder, type CustomItemInput } from "@/lib/orders";
import { whatsappUrl } from "@/lib/site";
import { isValidPhone, PHONE_HINT } from "@/lib/validation";
import { AddressFields, Field, emptyAddress, inputCls } from "@/components/AddressFields";

type Item = CustomItemInput & { id: number };

const TELAS = [
  "Retro (algodón/poliéster clásico)",
  "Versión Fan (poliéster liviano)",
  "Versión Jugador (dry-fit premium)",
];
const TALLES = ["S", "M", "L", "XL", "XXL"];

let seq = 1;
const emptyItem = (): Item => ({
  id: seq++,
  reference: "",
  fabric: TELAS[0],
  size: "M",
  patch: "",
  number: "",
  name: "",
});

export function PersonalizadoBuilder() {
  const [items, setItems] = useState<Item[]>([emptyItem()]);
  const [contact, setContact] = useState({
    customerName: "",
    customerPhone: "",
    customerEmail: "",
    notes: "",
  });
  const [address, setAddress] = useState(emptyAddress);
  const [phoneError, setPhoneError] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState<string | null>(null);

  const patch = (id: number, field: keyof CustomItemInput, value: string) =>
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, [field]: value } : it)));

  const addItem = () => setItems((prev) => [...prev, emptyItem()]);
  const removeItem = (id: number) =>
    setItems((prev) => (prev.length === 1 ? prev : prev.filter((it) => it.id !== id)));

  function addressLine() {
    const parts = [
      address.street,
      address.floor && `Piso ${address.floor}`,
      address.apartment && `Depto ${address.apartment}`,
      address.city,
      address.province,
      address.postalCode && `CP ${address.postalCode}`,
    ].filter(Boolean);
    return parts.join(", ");
  }

  function buildWhatsAppMessage(orderId: string) {
    let msg = `¡Hola Thor! Quiero hacer un pedido personalizado.\nPedido #${orderId}\n\n`;
    items.forEach((it, idx) => {
      msg += `Camiseta ${idx + 1}: ${it.reference}\n`;
      msg += `- Tela: ${it.fabric}\n- Talle: ${it.size}\n`;
      if (it.patch) msg += `- Parche: ${it.patch}\n`;
      if (it.number) msg += `- Número: ${it.number}\n`;
      if (it.name) msg += `- Nombre: ${it.name}\n`;
      msg += `\n`;
    });
    msg += `Datos de contacto:\n`;
    msg += `Nombre: ${contact.customerName}\nTeléfono: ${contact.customerPhone}\n`;
    msg += `Email: ${contact.customerEmail || "-"}\nDirección: ${addressLine()}\n`;
    if (address.deliveryNotes) msg += `Entrega: ${address.deliveryNotes}\n`;
    msg += `Notas: ${contact.notes || "-"}`;
    return msg;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setPhoneError("");
    if (!isValidPhone(contact.customerPhone)) {
      setPhoneError(PHONE_HINT);
      return;
    }
    setLoading(true);
    try {
      const orderId = await createCustomOrder({
        ...contact,
        ...address,
        items: items.map(({ reference, fabric, size, patch, number, name }) => ({
          reference,
          fabric,
          size,
          patch,
          number,
          name,
        })),
      });
      // Abrimos WhatsApp con el resumen del pedido
      window.open(whatsappUrl(buildWhatsAppMessage(orderId)), "_blank");
      setDone(orderId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo enviar el pedido.");
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="mx-auto max-w-lg px-5 py-16 text-center">
        <div className="text-4xl">✈️</div>
        <h2 className="mt-4 font-display text-3xl tracking-wide text-thor-ink">¡Pedido enviado!</h2>
        <p className="mt-3 text-thor-muted">
          Tu pedido <strong className="font-mono text-thor-ink">#{done}</strong> quedó registrado.
          Se abrió WhatsApp con el resumen — mandanos el mensaje y coordinamos precio final, tiempo
          de importación y forma de pago.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            href="/camisetas"
            className="rounded-xl bg-thor-gold px-6 py-3 font-mono text-sm font-bold uppercase tracking-wider text-thor-ink"
          >
            Volver al catálogo
          </Link>
          <Link
            href={`/pedido?id=${done}`}
            className="rounded-xl border border-thor-line px-6 py-3 font-mono text-sm font-bold uppercase tracking-wider text-thor-ink hover:border-thor-gold"
          >
            Seguir mi pedido
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-3xl px-5 py-12">
      {/* Ítems */}
      <div className="flex flex-col gap-5">
        {items.map((it, idx) => (
          <div key={it.id} className="rounded-2xl border border-thor-line bg-thor-paper p-5">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-mono text-xs font-bold uppercase tracking-wide text-thor-gold">
                Camiseta {idx + 1}
              </h3>
              {items.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeItem(it.id)}
                  className="font-mono text-xs text-thor-muted underline hover:text-red-600"
                >
                  Eliminar
                </button>
              )}
            </div>

            <Field label="Referencia (link o descripción de la camiseta)">
              <textarea
                required
                rows={2}
                value={it.reference}
                onChange={(e) => patch(it.id, "reference", e.target.value)}
                placeholder="Pegá un link o describí la camiseta (equipo, temporada, versión…)"
                className={inputCls}
              />
            </Field>

            <div className="grid gap-3 sm:grid-cols-3">
              <Field label="Tela">
                <select value={it.fabric} onChange={(e) => patch(it.id, "fabric", e.target.value)} className={inputCls}>
                  {TELAS.map((t) => (
                    <option key={t}>{t}</option>
                  ))}
                </select>
              </Field>
              <Field label="Talle">
                <select value={it.size} onChange={(e) => patch(it.id, "size", e.target.value)} className={inputCls}>
                  {TALLES.map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </Field>
              <Field label="Parche (opcional)">
                <input
                  value={it.patch}
                  onChange={(e) => patch(it.id, "patch", e.target.value)}
                  placeholder="Ej: Libertadores 2024"
                  className={inputCls}
                />
              </Field>
            </div>

            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              <Field label="Número (opcional)">
                <input
                  maxLength={2}
                  value={it.number}
                  onChange={(e) => patch(it.id, "number", e.target.value)}
                  placeholder="10"
                  className={inputCls}
                />
              </Field>
              <div className="sm:col-span-2">
                <Field label="Nombre en la espalda (opcional)">
                  <input
                    value={it.name}
                    onChange={(e) => patch(it.id, "name", e.target.value)}
                    placeholder="GONZÁLEZ"
                    className={inputCls}
                  />
                </Field>
              </div>
            </div>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={addItem}
        className="mt-4 rounded-xl border border-thor-line px-5 py-2.5 font-mono text-xs font-bold uppercase tracking-wider text-thor-ink hover:border-thor-gold hover:bg-thor-gold/10"
      >
        + Agregar otra camiseta
      </button>

      {/* Contacto */}
      <h3 className="mt-10 font-display text-2xl tracking-wide text-thor-ink">Tus datos</h3>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <Field label="Nombre y apellido">
          <input required value={contact.customerName} onChange={(e) => setContact({ ...contact, customerName: e.target.value })} className={inputCls} />
        </Field>
        <div>
          <Field label="Teléfono / WhatsApp">
            <input required type="tel" value={contact.customerPhone} onChange={(e) => setContact({ ...contact, customerPhone: e.target.value })} placeholder="+54 9 11 …" className={inputCls} />
          </Field>
          {phoneError && <p className="mt-1 text-xs text-red-600">{phoneError}</p>}
        </div>
        <div className="sm:col-span-2">
          <Field label="Email (opcional)">
            <input type="email" value={contact.customerEmail} onChange={(e) => setContact({ ...contact, customerEmail: e.target.value })} className={inputCls} />
          </Field>
        </div>
      </div>

      <h3 className="mt-8 font-mono text-xs font-bold uppercase tracking-wide text-thor-ink">
        Dirección de envío
      </h3>
      <div className="mt-3">
        <AddressFields value={address} onChange={setAddress} />
      </div>

      <div className="mt-4">
        <Field label="Notas adicionales (opcional)">
          <textarea rows={2} value={contact.notes} onChange={(e) => setContact({ ...contact, notes: e.target.value })} className={inputCls} />
        </Field>
      </div>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="mt-6 w-full rounded-xl bg-thor-gold px-6 py-3.5 font-mono text-sm font-bold uppercase tracking-wider text-thor-ink transition-transform hover:-translate-y-0.5 disabled:opacity-60 sm:w-auto"
      >
        {loading ? "Enviando…" : "Enviar pedido por WhatsApp →"}
      </button>
    </form>
  );
}
