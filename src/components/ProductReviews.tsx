"use client";

import { useState } from "react";
import type { Review } from "@/lib/reviews";

function Stars({ rating }: { rating: number }) {
  return (
    <span aria-hidden className="text-thor-gold">
      {"★".repeat(rating)}
      {"☆".repeat(5 - rating)}
    </span>
  );
}

export function ProductReviews({ productId, reviews }: { productId: number; reviews: Review[] }) {
  const [name, setName] = useState("");
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const average =
    reviews.length > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`/api/products/${productId}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, rating, comment }),
      });
      if (!res.ok) {
        let msg = "No se pudo enviar la reseña.";
        try {
          const data = await res.json();
          if (data?.errors) msg = Object.values(data.errors as Record<string, string[]>).flat().join(" ");
        } catch {
          /* sin cuerpo */
        }
        throw new Error(msg);
      }
      setSent(true);
      setShowForm(false);
      setName("");
      setComment("");
      setRating(5);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo enviar la reseña.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="mt-16 border-t border-thor-line pt-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl tracking-wide text-thor-ink">Reseñas</h2>
          {reviews.length > 0 && (
            <p className="mt-1 flex items-center gap-2 text-sm text-thor-muted">
              <Stars rating={Math.round(average)} />
              {average.toFixed(1)} · {reviews.length} reseña{reviews.length === 1 ? "" : "s"}
            </p>
          )}
        </div>
        {!showForm && !sent && (
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="rounded-lg border border-thor-line px-4 py-2 font-mono text-xs font-bold uppercase tracking-wider text-thor-ink hover:border-thor-gold hover:bg-thor-gold/10"
          >
            Dejar una reseña
          </button>
        )}
      </div>

      {sent && (
        <p className="mt-4 rounded-xl border border-thor-line bg-thor-cream-2 px-4 py-3 text-sm text-thor-ink-soft">
          ¡Gracias! Tu reseña va a aparecer acá una vez que la aprobemos.
        </p>
      )}

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="mt-5 flex flex-col gap-3 rounded-2xl border border-thor-line bg-thor-paper p-5"
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1 block font-mono text-[11px] uppercase tracking-wide text-thor-muted">
                Nombre
              </span>
              <input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-lg border border-thor-line bg-thor-cream px-3 py-2 text-thor-ink"
              />
            </label>
            <label className="block">
              <span className="mb-1 block font-mono text-[11px] uppercase tracking-wide text-thor-muted">
                Puntaje
              </span>
              <select
                value={rating}
                onChange={(e) => setRating(Number(e.target.value))}
                className="w-full rounded-lg border border-thor-line bg-thor-cream px-3 py-2 text-thor-ink"
              >
                {[5, 4, 3, 2, 1].map((n) => (
                  <option key={n} value={n}>
                    {"★".repeat(n)}
                    {"☆".repeat(5 - n)}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label className="block">
            <span className="mb-1 block font-mono text-[11px] uppercase tracking-wide text-thor-muted">
              Comentario
            </span>
            <textarea
              required
              rows={3}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="w-full rounded-lg border border-thor-line bg-thor-cream px-3 py-2 text-thor-ink"
            />
          </label>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="rounded-lg border border-thor-line px-4 py-2 font-mono text-xs font-bold uppercase tracking-wider text-thor-muted"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-thor-gold px-4 py-2 font-mono text-xs font-bold uppercase tracking-wider text-thor-ink disabled:opacity-60"
            >
              {loading ? "Enviando…" : "Enviar reseña"}
            </button>
          </div>
        </form>
      )}

      {reviews.length > 0 ? (
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {reviews.map((r) => (
            <figure key={r.id} className="rounded-2xl border border-thor-line bg-thor-paper p-4">
              <Stars rating={r.rating} />
              <blockquote className="mt-2 text-sm leading-relaxed text-thor-ink-soft">
                “{r.comment}”
              </blockquote>
              <figcaption className="mt-3 font-mono text-xs font-bold uppercase tracking-wider text-thor-ink">
                {r.name}
              </figcaption>
            </figure>
          ))}
        </div>
      ) : (
        !showForm && (
          <p className="mt-4 text-sm text-thor-muted">Todavía no hay reseñas de este producto.</p>
        )
      )}
    </section>
  );
}
