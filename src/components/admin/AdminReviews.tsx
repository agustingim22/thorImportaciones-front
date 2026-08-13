"use client";

import { useCallback, useEffect, useState } from "react";
import {
  adminDeleteReview,
  adminListReviews,
  adminSetReviewPublished,
  type AdminReview,
} from "@/lib/admin";

export function AdminReviews() {
  const [reviews, setReviews] = useState<AdminReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "pending" | "published">("pending");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setReviews(await adminListReviews());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function togglePublished(r: AdminReview) {
    await adminSetReviewPublished(r.id, !r.published);
    setReviews((prev) => prev.map((x) => (x.id === r.id ? { ...x, published: !x.published } : x)));
  }

  async function handleDelete(r: AdminReview) {
    if (!confirm(`¿Borrar la reseña de "${r.name}" sobre "${r.productName}"?`)) return;
    await adminDeleteReview(r.id);
    setReviews((prev) => prev.filter((x) => x.id !== r.id));
  }

  const filtered = reviews.filter((r) => {
    if (filter === "pending") return !r.published;
    if (filter === "published") return r.published;
    return true;
  });

  return (
    <div>
      <div className="mb-4 inline-flex gap-1 rounded-xl border border-thor-line bg-thor-paper p-1">
        {(
          [
            ["pending", "Pendientes"],
            ["published", "Publicadas"],
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

      <div className="overflow-x-auto rounded-2xl border border-thor-line bg-thor-paper">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-thor-line text-left font-mono text-[11px] uppercase tracking-wide text-thor-muted">
              <th className="px-4 py-3">Producto</th>
              <th className="px-4 py-3">Cliente</th>
              <th className="px-4 py-3">Comentario</th>
              <th className="px-4 py-3">Puntaje</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-thor-muted">
                  Cargando…
                </td>
              </tr>
            )}
            {!loading && filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-thor-muted">
                  No hay reseñas para mostrar.
                </td>
              </tr>
            )}
            {!loading &&
              filtered.map((r) => (
                <tr key={r.id} className="border-b border-thor-line last:border-0 align-top">
                  <td className="max-w-[160px] px-4 py-3 text-thor-ink">{r.productName}</td>
                  <td className="px-4 py-3 font-semibold text-thor-ink">{r.name}</td>
                  <td className="max-w-xs px-4 py-3 text-thor-muted">{r.comment}</td>
                  <td className="px-4 py-3 text-thor-gold">
                    {"★".repeat(r.rating)}
                    {"☆".repeat(5 - r.rating)}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => togglePublished(r)}
                      className={`rounded-full px-2 py-0.5 font-mono text-[10px] uppercase tabular-nums ${
                        r.published ? "bg-thor-land/15 text-thor-land" : "bg-thor-muted/15 text-thor-muted"
                      }`}
                    >
                      {r.published ? "Publicada" : "Pendiente"}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => togglePublished(r)}
                        className="rounded-md border border-thor-line px-2.5 py-1 font-mono text-xs text-thor-ink hover:border-thor-gold"
                      >
                        {r.published ? "Ocultar" : "Aprobar"}
                      </button>
                      <button
                        onClick={() => handleDelete(r)}
                        className="rounded-md border border-thor-line px-2.5 py-1 font-mono text-xs text-red-600 hover:border-red-500"
                      >
                        Borrar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
