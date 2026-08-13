"use client";

import { useCallback, useEffect, useState } from "react";
import { adminListSubscribers, type AdminSubscriber } from "@/lib/admin";

function exportCsv(subscribers: AdminSubscriber[]) {
  const headers = ["Email", "Fecha"];
  const rows = subscribers.map((s) => [s.email, new Date(s.createdAt).toLocaleString("es-AR")]);
  const esc = (v: string) => `"${String(v).replace(/"/g, '""')}"`;
  const csv = "﻿" + [headers, ...rows].map((r) => r.map(esc).join(";")).join("\r\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `newsletter-thor-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function AdminNewsletter() {
  const [subscribers, setSubscribers] = useState<AdminSubscriber[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setSubscribers(await adminListSubscribers());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-thor-muted">{subscribers.length} suscriptos</p>
        <button
          onClick={() => exportCsv(subscribers)}
          disabled={subscribers.length === 0}
          className="rounded-lg bg-thor-land px-4 py-2 font-mono text-xs font-bold uppercase tracking-wider text-white disabled:opacity-50"
        >
          ↓ Exportar a Excel
        </button>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-thor-line bg-thor-paper">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-thor-line text-left font-mono text-[11px] uppercase tracking-wide text-thor-muted">
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Fecha</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={2} className="px-4 py-8 text-center text-thor-muted">
                  Cargando…
                </td>
              </tr>
            )}
            {!loading && subscribers.length === 0 && (
              <tr>
                <td colSpan={2} className="px-4 py-8 text-center text-thor-muted">
                  Todavía nadie se suscribió.
                </td>
              </tr>
            )}
            {!loading &&
              subscribers.map((s) => (
                <tr key={s.id} className="border-b border-thor-line last:border-0">
                  <td className="px-4 py-3 text-thor-ink">{s.email}</td>
                  <td className="px-4 py-3 text-thor-muted">
                    {new Date(s.createdAt).toLocaleDateString("es-AR")}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
