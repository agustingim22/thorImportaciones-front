"use client";

import { useState } from "react";
import type { ProductQuestion } from "@/lib/questions";

export function ProductQuestions({
  productId,
  questions,
}: {
  productId: number;
  questions: ProductQuestion[];
}) {
  const [name, setName] = useState("");
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const [showForm, setShowForm] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`/api/products/${productId}/questions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, question }),
      });
      if (!res.ok) {
        let msg = "No se pudo enviar la pregunta.";
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
      setQuestion("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo enviar la pregunta.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="mt-16 border-t border-thor-line pt-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="font-display text-2xl tracking-wide text-thor-ink">Preguntas y respuestas</h2>
        {!showForm && !sent && (
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="rounded-lg border border-thor-line px-4 py-2 font-mono text-xs font-bold uppercase tracking-wider text-thor-ink hover:border-thor-gold hover:bg-thor-gold/10"
          >
            Hacer una pregunta
          </button>
        )}
      </div>

      {sent && (
        <p className="mt-4 rounded-xl border border-thor-line bg-thor-cream-2 px-4 py-3 text-sm text-thor-ink-soft">
          ¡Gracias! Te respondemos pronto y tu pregunta va a aparecer acá.
        </p>
      )}

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="mt-5 flex flex-col gap-3 rounded-2xl border border-thor-line bg-thor-paper p-5"
        >
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
              Tu pregunta
            </span>
            <textarea
              required
              rows={3}
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Ej: ¿esta versión viene con el parche de la Libertadores?"
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
              {loading ? "Enviando…" : "Enviar pregunta"}
            </button>
          </div>
        </form>
      )}

      {questions.length > 0 ? (
        <div className="mt-6 flex flex-col gap-4">
          {questions.map((q) => (
            <div key={q.id} className="rounded-2xl border border-thor-line bg-thor-paper p-4">
              <p className="font-mono text-xs font-bold uppercase tracking-wider text-thor-ink">
                {q.name} preguntó:
              </p>
              <p className="mt-1 text-sm text-thor-ink-soft">{q.question}</p>
              <p className="mt-3 border-t border-dashed border-thor-line pt-3 text-sm text-thor-ink">
                <span className="font-mono text-xs font-bold uppercase tracking-wider text-thor-gold">
                  Respuesta:{" "}
                </span>
                {q.answer}
              </p>
            </div>
          ))}
        </div>
      ) : (
        !showForm && (
          <p className="mt-4 text-sm text-thor-muted">Todavía no hay preguntas sobre este producto.</p>
        )
      )}
    </section>
  );
}
