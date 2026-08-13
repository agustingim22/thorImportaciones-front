"use client";

import { useState } from "react";
import { subscribeNewsletter } from "@/lib/newsletter";

export function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await subscribeNewsletter(email);
      setDone(true);
      setEmail("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo suscribir.");
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <p className="font-mono text-xs text-thor-land">
        ¡Listo! Te vamos a avisar de nuevas camisetas y promos.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2 sm:flex-row sm:items-start">
      <div>
        <div className="flex gap-2">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="tu@email.com"
            className="w-48 rounded-lg border border-thor-line bg-thor-paper px-3 py-2 text-sm text-thor-ink"
          />
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-thor-ink px-4 py-2 font-mono text-xs font-bold uppercase tracking-wider text-thor-cream disabled:opacity-60"
          >
            {loading ? "…" : "Sumarme"}
          </button>
        </div>
        {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
      </div>
    </form>
  );
}
