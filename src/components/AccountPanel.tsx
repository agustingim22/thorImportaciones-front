"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { getMyOrders, type MyOrder } from "@/lib/myOrders";
import { whatsappUrl } from "@/lib/site";
import { Field, inputCls } from "@/components/AddressFields";

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

export function AccountPanel() {
  const { user, loading } = useAuth();

  if (loading) return <p className="px-5 py-20 text-center text-thor-muted">Cargando…</p>;
  if (!user) return <AuthForms />;
  return <LoggedInPanel />;
}

function AuthForms() {
  const { login, register } = useAuth();
  const [mode, setMode] = useState<"login" | "register" | "forgot">("login");
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [forgotSent, setForgotSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (mode === "login") await login({ email: form.email, password: form.password });
      else if (mode === "register") await register(form);
      else {
        await fetch("/api/auth/forgot-password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: form.email }),
        });
        setForgotSent(true);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Algo salió mal.");
    } finally {
      setLoading(false);
    }
  }

  if (mode === "forgot") {
    return (
      <div className="mx-auto max-w-sm px-5 py-16">
        <h1 className="font-display text-3xl tracking-wide text-thor-ink">Recuperar contraseña</h1>
        {forgotSent ? (
          <p className="mt-5 text-sm text-thor-ink-soft">
            Si ese email está registrado, te mandamos un link para restablecer tu contraseña. Revisá tu bandeja de entrada.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-3">
            <Field label="Email">
              <input
                required
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className={inputCls}
              />
            </Field>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="mt-2 rounded-lg bg-thor-gold px-4 py-2.5 font-mono text-sm font-bold uppercase tracking-wider text-thor-ink disabled:opacity-60"
            >
              {loading ? "Enviando…" : "Enviar link"}
            </button>
          </form>
        )}
        <button
          type="button"
          onClick={() => {
            setMode("login");
            setForgotSent(false);
            setError("");
          }}
          className="mt-4 font-mono text-xs uppercase tracking-wider text-thor-muted underline"
        >
          ← Volver a ingresar
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-sm px-5 py-16">
      <h1 className="font-display text-3xl tracking-wide text-thor-ink">Mi cuenta</h1>

      <div className="mt-5 inline-flex gap-1 rounded-xl border border-thor-line bg-thor-paper p-1">
        {(["login", "register"] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => {
              setMode(m);
              setError("");
            }}
            className={`rounded-lg px-4 py-2 font-mono text-xs font-bold uppercase tracking-wider transition-colors ${
              mode === m ? "bg-thor-gold text-thor-ink" : "text-thor-muted hover:text-thor-ink"
            }`}
          >
            {m === "login" ? "Ingresar" : "Crear cuenta"}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-3">
        {mode === "register" && (
          <Field label="Nombre y apellido">
            <input
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className={inputCls}
            />
          </Field>
        )}
        <Field label="Email">
          <input
            required
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className={inputCls}
          />
        </Field>
        {mode === "register" && (
          <Field label="Teléfono (opcional)">
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className={inputCls}
            />
          </Field>
        )}
        <Field label="Contraseña">
          <input
            required
            type="password"
            minLength={mode === "register" ? 8 : undefined}
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            placeholder={mode === "register" ? "Mínimo 8 caracteres" : undefined}
            className={inputCls}
          />
        </Field>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="mt-2 rounded-lg bg-thor-gold px-4 py-2.5 font-mono text-sm font-bold uppercase tracking-wider text-thor-ink disabled:opacity-60"
        >
          {loading ? "Un momento…" : mode === "login" ? "Ingresar" : "Crear cuenta"}
        </button>

        {mode === "login" && (
          <p className="mt-1 text-center text-xs text-thor-muted">
            ¿Olvidaste tu contraseña?{" "}
            <button
              type="button"
              onClick={() => {
                setMode("forgot");
                setError("");
              }}
              className="text-thor-gold underline"
            >
              Recuperarla
            </button>
            {" · "}
            <a href={whatsappUrl("¡Hola! Me olvidé la contraseña de mi cuenta.")} className="text-thor-gold underline">
              o escribinos por WhatsApp
            </a>
            .
          </p>
        )}
      </form>
    </div>
  );
}

function LoggedInPanel() {
  const { user, logout, updateProfile } = useAuth();
  const [tab, setTab] = useState<"orders" | "profile">("orders");

  if (!user) return null;

  return (
    <div className="mx-auto max-w-3xl px-5 py-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl tracking-wide text-thor-ink">Hola, {user.name.split(" ")[0]}</h1>
          <p className="text-sm text-thor-muted">{user.email}</p>
        </div>
        <button
          onClick={() => logout()}
          className="rounded-lg border border-thor-line px-4 py-2 font-mono text-xs font-bold uppercase tracking-wider text-thor-muted hover:text-thor-ink"
        >
          Salir
        </button>
      </div>

      <div className="mt-5 inline-flex gap-1 rounded-xl border border-thor-line bg-thor-paper p-1">
        {([["orders", "Mis pedidos"], ["profile", "Mis datos"]] as const).map(([key, label]) => (
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

      <div className="mt-6">
        {tab === "orders" ? <OrderHistory /> : <ProfileForm onSave={updateProfile} />}
      </div>
    </div>
  );
}

function orderDetail(o: MyOrder): string {
  if (o.kind === "Custom") {
    return o.customItems
      .map((c) => {
        let line = c.reference;
        if (c.name) line += ` · Nombre: ${c.name}`;
        if (c.number) line += ` · N°: ${c.number}`;
        if (c.patch) line += ` · Parche: ${c.patch}`;
        return line;
      })
      .join("  ·  ");
  }
  return o.items
    .map((i) => {
      let line = `${i.productName} x${i.quantity}`;
      if (i.customName) line += ` · Nombre: ${i.customName}`;
      if (i.customNumber) line += ` · N°: ${i.customNumber}`;
      if (i.patchLabel) line += ` · Parche: ${i.patchLabel}`;
      return line;
    })
    .join("  ·  ");
}

function OrderHistory() {
  const [orders, setOrders] = useState<MyOrder[] | null>(null);

  useEffect(() => {
    getMyOrders()
      .then(setOrders)
      .catch(() => setOrders([]));
  }, []);

  if (orders === null) return <p className="text-sm text-thor-muted">Cargando pedidos…</p>;
  if (orders.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-thor-line bg-thor-paper p-8 text-center text-sm text-thor-muted">
        Todavía no hiciste ningún pedido.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {orders.map((o) => (
        <div key={o.publicId} className="rounded-2xl border border-thor-line bg-thor-paper p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <span className="font-mono text-xs text-thor-muted">
                {new Date(o.createdAt).toLocaleDateString("es-AR")} · Pedido {o.publicId}
              </span>
              <span
                className={`ml-2 rounded-full px-2 py-0.5 font-mono text-[10px] uppercase ${
                  STATUS_COLOR[o.status] ?? "bg-thor-line/40 text-thor-muted"
                }`}
              >
                {STATUS_LABEL[o.status] ?? o.status}
              </span>
            </div>
            <span className="font-mono font-bold tabular-nums text-thor-gold">
              {o.kind === "Custom" ? "a coordinar" : `$${o.total.toLocaleString("es-AR")}`}
            </span>
          </div>
          <p className="mt-2 text-sm text-thor-ink-soft">{orderDetail(o)}</p>
        </div>
      ))}
    </div>
  );
}

type ProfileFormValues = {
  name: string;
  phone: string | null;
  street: string | null;
  postalCode: string | null;
  city: string | null;
  province: string | null;
  floor: string | null;
  apartment: string | null;
};

function ProfileForm({ onSave }: { onSave: (v: ProfileFormValues) => Promise<void> }) {
  const { user } = useAuth();
  const [form, setForm] = useState<ProfileFormValues>({
    name: user?.name ?? "",
    phone: user?.phone ?? "",
    street: user?.street ?? "",
    postalCode: user?.postalCode ?? "",
    city: user?.city ?? "",
    province: user?.province ?? "",
    floor: user?.floor ?? "",
    apartment: user?.apartment ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      await onSave(form);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl border border-thor-line bg-thor-paper p-5">
      <p className="mb-4 text-xs text-thor-muted">
        Estos datos se usan para prellenar tus próximas compras.
      </p>
      <div className="grid gap-3">
        <Field label="Nombre y apellido">
          <input
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className={inputCls}
          />
        </Field>
        <Field label="Teléfono">
          <input
            value={form.phone ?? ""}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            className={inputCls}
          />
        </Field>
        <Field label="Calle y número">
          <input
            value={form.street ?? ""}
            onChange={(e) => setForm({ ...form, street: e.target.value })}
            className={inputCls}
          />
        </Field>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Field label="Código postal">
            <input
              value={form.postalCode ?? ""}
              onChange={(e) => setForm({ ...form, postalCode: e.target.value })}
              className={inputCls}
            />
          </Field>
          <Field label="Piso">
            <input
              value={form.floor ?? ""}
              onChange={(e) => setForm({ ...form, floor: e.target.value })}
              className={inputCls}
            />
          </Field>
          <Field label="Depto">
            <input
              value={form.apartment ?? ""}
              onChange={(e) => setForm({ ...form, apartment: e.target.value })}
              className={inputCls}
            />
          </Field>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Ciudad">
            <input
              value={form.city ?? ""}
              onChange={(e) => setForm({ ...form, city: e.target.value })}
              className={inputCls}
            />
          </Field>
          <Field label="Provincia">
            <input
              value={form.province ?? ""}
              onChange={(e) => setForm({ ...form, province: e.target.value })}
              className={inputCls}
            />
          </Field>
        </div>
      </div>

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={saving}
        className="mt-4 rounded-lg bg-thor-gold px-4 py-2.5 font-mono text-xs font-bold uppercase tracking-wider text-thor-ink disabled:opacity-60"
      >
        {saving ? "Guardando…" : saved ? "✓ Guardado" : "Guardar"}
      </button>
    </form>
  );
}
