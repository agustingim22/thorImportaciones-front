"use client";

import { useEffect, useState } from "react";
import { getNewsletterPopup, subscribeNewsletter, type NewsletterPopupPublic } from "@/lib/newsletter";
import { LogoMark } from "./Logo";

const STORAGE_KEY = "thor-newsletter-popup-seen";
const SHOW_DELAY_MS = 2000;

export function NewsletterPopup() {
  const [config, setConfig] = useState<NewsletterPopupPublic | null>(null);
  const [visible, setVisible] = useState(false);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    let seen = true;
    try {
      seen = localStorage.getItem(STORAGE_KEY) === "1";
    } catch {
      /* si el navegador bloquea localStorage, tratamos como ya visto (no molestamos) */
    }
    if (seen) return;

    getNewsletterPopup().then((cfg) => {
      if (!cfg.enabled) return;
      setConfig(cfg);
      const t = setTimeout(() => setVisible(true), SHOW_DELAY_MS);
      return () => clearTimeout(t);
    });
  }, []);

  function dismiss() {
    setVisible(false);
    try {
      localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      /* no crítico */
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await subscribeNewsletter(email, true);
      setDone(true);
      try {
        localStorage.setItem(STORAGE_KEY, "1");
      } catch {
        /* no crítico */
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo suscribir.");
    } finally {
      setLoading(false);
    }
  }

  if (!visible || !config) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4"
      onClick={dismiss}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-sm rounded-2xl border border-thor-line bg-thor-cream p-6 text-center shadow-2xl"
      >
        <button
          type="button"
          onClick={dismiss}
          aria-label="Cerrar"
          className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-full text-thor-muted hover:bg-thor-cream-2 hover:text-thor-ink"
        >
          ✕
        </button>

        <LogoMark className="mx-auto h-12 w-12" />

        {done ? (
          <>
            <h2 className="mt-4 font-display text-2xl tracking-wide text-thor-ink">¡Listo!</h2>
            <p className="mt-2 text-sm text-thor-ink-soft">
              Te mandamos el cupón a <strong className="text-thor-ink">{email}</strong>. Revisá tu
              bandeja de entrada.
            </p>
          </>
        ) : (
          <>
            <h2 className="mt-4 font-display text-2xl leading-tight tracking-wide text-thor-ink">
              {config.headline}
            </h2>
            {config.discountLabel && (
              <p className="mt-2 font-display text-3xl text-thor-gold">{config.discountLabel}</p>
            )}
            <p className="mt-2 text-sm text-thor-ink-soft">{config.subtext}</p>

            <form onSubmit={handleSubmit} className="mt-5 flex flex-col gap-2">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@email.com"
                className="w-full rounded-lg border border-thor-line bg-thor-paper px-3 py-2.5 text-center text-sm text-thor-ink"
              />
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-thor-gold px-6 py-3 font-mono text-sm font-bold uppercase tracking-wider text-thor-ink transition-transform hover:-translate-y-0.5 disabled:opacity-60"
              >
                {loading ? "..." : "Quiero mi cupón"}
              </button>
            </form>
            {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
            <p className="mt-3 text-[11px] text-thor-muted">Te lo mandamos por email al toque.</p>
          </>
        )}
      </div>
    </div>
  );
}
