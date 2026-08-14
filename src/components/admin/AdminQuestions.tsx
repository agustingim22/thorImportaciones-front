"use client";

import { useCallback, useEffect, useState } from "react";
import {
  adminAnswerQuestion,
  adminDeleteQuestion,
  adminListQuestions,
  type AdminQuestion,
} from "@/lib/admin";

export function AdminQuestions() {
  const [questions, setQuestions] = useState<AdminQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"pending" | "answered" | "all">("pending");
  const [drafts, setDrafts] = useState<Record<number, string>>({});
  const [saving, setSaving] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setQuestions(await adminListQuestions());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleAnswer(q: AdminQuestion) {
    const answer = (drafts[q.id] ?? q.answer ?? "").trim();
    if (!answer) return;
    setSaving(q.id);
    try {
      await adminAnswerQuestion(q.id, answer);
      setQuestions((prev) => prev.map((x) => (x.id === q.id ? { ...x, answer } : x)));
    } finally {
      setSaving(null);
    }
  }

  async function handleUnanswer(q: AdminQuestion) {
    setSaving(q.id);
    try {
      await adminAnswerQuestion(q.id, null);
      setQuestions((prev) => prev.map((x) => (x.id === q.id ? { ...x, answer: null } : x)));
    } finally {
      setSaving(null);
    }
  }

  async function handleDelete(q: AdminQuestion) {
    if (!confirm(`¿Borrar la pregunta de "${q.name}" sobre "${q.productName}"?`)) return;
    await adminDeleteQuestion(q.id);
    setQuestions((prev) => prev.filter((x) => x.id !== q.id));
  }

  const filtered = questions.filter((q) => {
    if (filter === "pending") return !q.answer;
    if (filter === "answered") return !!q.answer;
    return true;
  });

  return (
    <div>
      <div className="mb-4 inline-flex gap-1 rounded-xl border border-thor-line bg-thor-paper p-1">
        {(
          [
            ["pending", "Pendientes"],
            ["answered", "Respondidas"],
            ["all", "Todas"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`rounded-lg px-3 py-1.5 font-mono text-[11px] font-bold uppercase tracking-wider transition-colors ${
              filter === key ? "bg-thor-gold text-thor-ink" : "text-thor-muted hover:text-thor-ink"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {loading && <p className="text-sm text-thor-muted">Cargando…</p>}
      {!loading && filtered.length === 0 && (
        <div className="rounded-2xl border border-dashed border-thor-line bg-thor-paper p-8 text-center text-sm text-thor-muted">
          No hay preguntas para mostrar.
        </div>
      )}

      <div className="flex flex-col gap-3">
        {filtered.map((q) => (
          <div key={q.id} className="rounded-2xl border border-thor-line bg-thor-paper p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-mono text-xs text-thor-muted">
                {q.productName} · {new Date(q.createdAt).toLocaleDateString("es-AR")}
              </span>
              <span
                className={`rounded-full px-2 py-0.5 font-mono text-[10px] uppercase ${
                  q.answer ? "bg-thor-land/15 text-thor-land" : "bg-thor-gold/15 text-thor-gold"
                }`}
              >
                {q.answer ? "Respondida" : "Pendiente"}
              </span>
            </div>
            <p className="mt-2 text-sm font-semibold text-thor-ink">{q.name} preguntó:</p>
            <p className="text-sm text-thor-ink-soft">{q.question}</p>

            <textarea
              rows={2}
              value={drafts[q.id] ?? q.answer ?? ""}
              onChange={(e) => setDrafts((prev) => ({ ...prev, [q.id]: e.target.value }))}
              placeholder="Escribí la respuesta…"
              className="mt-3 w-full rounded-lg border border-thor-line bg-thor-cream px-3 py-2 text-sm text-thor-ink"
            />
            <div className="mt-2 flex justify-end gap-2">
              {q.answer && (
                <button
                  onClick={() => handleUnanswer(q)}
                  disabled={saving === q.id}
                  className="rounded-md border border-thor-line px-2.5 py-1 font-mono text-xs text-thor-muted hover:text-thor-ink disabled:opacity-60"
                >
                  Ocultar respuesta
                </button>
              )}
              <button
                onClick={() => handleAnswer(q)}
                disabled={saving === q.id}
                className="rounded-md bg-thor-gold px-3 py-1 font-mono text-xs font-bold uppercase tracking-wider text-thor-ink disabled:opacity-60"
              >
                {saving === q.id ? "Guardando…" : "Guardar respuesta"}
              </button>
              <button
                onClick={() => handleDelete(q)}
                className="rounded-md border border-thor-line px-2.5 py-1 font-mono text-xs text-red-600 hover:border-red-500"
              >
                Borrar
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
