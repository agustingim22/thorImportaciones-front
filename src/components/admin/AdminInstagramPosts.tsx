"use client";

import { useCallback, useEffect, useState } from "react";
import {
  adminCreateInstagramPost,
  adminDeleteInstagramPost,
  adminListInstagramPosts,
  type AdminInstagramPost,
} from "@/lib/admin";

export function AdminInstagramPosts() {
  const [posts, setPosts] = useState<AdminInstagramPost[]>([]);
  const [loading, setLoading] = useState(false);
  const [url, setUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setPosts(await adminListInstagramPosts());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      await adminCreateInstagramPost(url);
      setUrl("");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo agregar.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(p: AdminInstagramPost) {
    if (!confirm("¿Quitar este post de la home?")) return;
    await adminDeleteInstagramPost(p.id);
    await load();
  }

  return (
    <div>
      <p className="text-sm text-thor-muted">
        Pegá el link de un post o reel de Instagram (ej. instagram.com/p/ABC123) para mostrarlo en
        la home como prueba social. Se muestran los últimos 6 que cargues.
      </p>

      <form onSubmit={handleAdd} className="mt-4 flex gap-2">
        <input
          required
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://www.instagram.com/p/..."
          className="w-full rounded-lg border border-thor-line bg-thor-paper px-3 py-2 text-sm text-thor-ink"
        />
        <button
          type="submit"
          disabled={saving}
          className="shrink-0 rounded-lg bg-thor-gold px-4 py-2 font-mono text-xs font-bold uppercase tracking-wider text-thor-ink disabled:opacity-60"
        >
          {saving ? "..." : "+ Agregar"}
        </button>
      </form>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

      <div className="mt-4 overflow-x-auto rounded-2xl border border-thor-line bg-thor-paper">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-thor-line text-left font-mono text-[11px] uppercase tracking-wide text-thor-muted">
              <th className="px-4 py-3">Link</th>
              <th className="px-4 py-3 text-right">Acciones</th>
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
            {!loading && posts.length === 0 && (
              <tr>
                <td colSpan={2} className="px-4 py-8 text-center text-thor-muted">
                  Todavía no agregaste ningún post. La sección no se muestra en la home hasta que
                  haya al menos uno.
                </td>
              </tr>
            )}
            {!loading &&
              posts.map((p) => (
                <tr key={p.id} className="border-b border-thor-line last:border-0">
                  <td className="max-w-md truncate px-4 py-3 text-thor-ink">
                    <a href={p.url} target="_blank" rel="noopener noreferrer" className="underline hover:text-thor-gold">
                      {p.url}
                    </a>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => handleDelete(p)}
                      className="rounded-md border border-thor-line px-2.5 py-1 font-mono text-xs text-red-600 hover:border-red-500"
                    >
                      Quitar
                    </button>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
