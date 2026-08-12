"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Field, inputCls } from "@/components/AddressFields";

function ResetForm() {
  const params = useSearchParams();
  const token = params.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (password !== confirm) {
      setError("Las contraseñas no coinciden.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data?.error ?? Object.values(data?.errors ?? {}).flat().join(" ") ?? "No se pudo cambiar la contraseña.");
      }
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo cambiar la contraseña.");
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <div className="mx-auto max-w-sm px-5 py-16 text-center">
        <p className="text-sm text-thor-muted">Este link no es válido. Pedí uno nuevo desde Mi cuenta.</p>
        <Link href="/cuenta" className="mt-4 inline-block font-mono text-xs text-thor-gold underline">
          Ir a Mi cuenta
        </Link>
      </div>
    );
  }

  if (done) {
    return (
      <div className="mx-auto max-w-sm px-5 py-16 text-center">
        <div className="text-4xl">✅</div>
        <h1 className="mt-4 font-display text-2xl tracking-wide text-thor-ink">¡Listo!</h1>
        <p className="mt-2 text-sm text-thor-muted">Tu contraseña se cambió correctamente.</p>
        <Link
          href="/cuenta"
          className="mt-6 inline-block rounded-lg bg-thor-gold px-5 py-2.5 font-mono text-xs font-bold uppercase tracking-wider text-thor-ink"
        >
          Ingresar
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-sm px-5 py-16">
      <h1 className="font-display text-3xl tracking-wide text-thor-ink">Nueva contraseña</h1>
      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-3">
        <Field label="Contraseña nueva">
          <input
            required
            type="password"
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Mínimo 8 caracteres"
            className={inputCls}
          />
        </Field>
        <Field label="Repetí la contraseña">
          <input
            required
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className={inputCls}
          />
        </Field>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="mt-2 rounded-lg bg-thor-gold px-4 py-2.5 font-mono text-sm font-bold uppercase tracking-wider text-thor-ink disabled:opacity-60"
        >
          {loading ? "Guardando…" : "Cambiar contraseña"}
        </button>
      </form>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<p className="px-5 py-16 text-center text-thor-muted">Cargando…</p>}>
      <ResetForm />
    </Suspense>
  );
}
