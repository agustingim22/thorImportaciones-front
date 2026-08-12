"use client";

import type { ShippingAddress } from "@/lib/orders";

export const inputCls =
  "w-full rounded-lg border border-thor-line bg-thor-cream px-3 py-2 text-thor-ink";

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block font-mono text-[11px] uppercase tracking-wide text-thor-muted">
        {label}
      </span>
      {children}
    </label>
  );
}

/** Campos de dirección de envío, reutilizados por el carrito y el pedido personalizado. */
export function AddressFields({
  value,
  onChange,
}: {
  value: ShippingAddress;
  onChange: (next: ShippingAddress) => void;
}) {
  const set = (field: keyof ShippingAddress) => (v: string) => onChange({ ...value, [field]: v });

  return (
    <div className="grid gap-3">
      <Field label="Calle y número">
        <input
          required
          value={value.street}
          onChange={(e) => set("street")(e.target.value)}
          placeholder="Av. Siempreviva 742"
          className={inputCls}
        />
      </Field>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Field label="Código postal">
          <input
            required
            value={value.postalCode}
            onChange={(e) => set("postalCode")(e.target.value)}
            className={inputCls}
          />
        </Field>
        <Field label="Piso (opcional)">
          <input value={value.floor} onChange={(e) => set("floor")(e.target.value)} className={inputCls} />
        </Field>
        <Field label="Depto (opcional)">
          <input value={value.apartment} onChange={(e) => set("apartment")(e.target.value)} className={inputCls} />
        </Field>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Ciudad">
          <input
            required
            value={value.city}
            onChange={(e) => set("city")(e.target.value)}
            className={inputCls}
          />
        </Field>
        <Field label="Provincia">
          <input
            required
            value={value.province}
            onChange={(e) => set("province")(e.target.value)}
            className={inputCls}
          />
        </Field>
      </div>
      <Field label="Especificaciones de entrega (opcional)">
        <textarea
          rows={2}
          value={value.deliveryNotes}
          onChange={(e) => set("deliveryNotes")(e.target.value)}
          placeholder="Horarios, entre calles, referencias para el repartidor…"
          className={inputCls}
        />
      </Field>
    </div>
  );
}

export const emptyAddress: ShippingAddress = {
  street: "",
  postalCode: "",
  city: "",
  province: "",
  floor: "",
  apartment: "",
  deliveryNotes: "",
};
