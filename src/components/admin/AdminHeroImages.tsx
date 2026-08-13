"use client";

import { useCallback, useEffect, useState } from "react";
import {
  adminCreateHeroImage,
  adminDeleteHeroImage,
  adminListHeroImages,
  adminSetHeroImagePosition,
  adminUploadHeroImage,
  type AdminHeroImage,
} from "@/lib/admin";

export function AdminHeroImages() {
  const [images, setImages] = useState<AdminHeroImage[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setImages(await adminListHeroImages());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError("");
    setUploading(true);
    try {
      const url = await adminUploadHeroImage(file);
      await adminCreateHeroImage(url);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo subir la imagen.");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  async function move(index: number, dir: -1 | 1) {
    const target = index + dir;
    if (target < 0 || target >= images.length) return;
    const a = images[index];
    const b = images[target];
    await Promise.all([
      adminSetHeroImagePosition(a.id, b.position),
      adminSetHeroImagePosition(b.id, a.position),
    ]);
    await load();
  }

  async function handleDelete(img: AdminHeroImage) {
    if (!confirm("¿Borrar esta foto del carrusel?")) return;
    await adminDeleteHeroImage(img.id);
    await load();
  }

  return (
    <div>
      <p className="text-sm text-thor-muted">
        Fotos que rotan en el carrusel de la portada. Si no cargás ninguna, se muestra el diseño
        por defecto.
      </p>

      <label className="mt-4 inline-block cursor-pointer rounded-lg bg-thor-gold px-4 py-2.5 font-mono text-xs font-bold uppercase tracking-wider text-thor-ink">
        {uploading ? "Subiendo…" : "+ Agregar foto"}
        <input
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleUpload}
          disabled={uploading}
        />
      </label>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

      <div className="mt-4 flex flex-col gap-2">
        {loading && <p className="text-sm text-thor-muted">Cargando…</p>}
        {!loading && images.length === 0 && (
          <p className="rounded-2xl border border-dashed border-thor-line bg-thor-paper p-6 text-center text-sm text-thor-muted">
            Todavía no cargaste ninguna foto.
          </p>
        )}
        {!loading &&
          images.map((img, i) => (
            <div
              key={img.id}
              className="flex items-center gap-3 rounded-2xl border border-thor-line bg-thor-paper p-3"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img.imageUrl}
                alt={`Foto ${i + 1} del carrusel`}
                className="h-16 w-16 shrink-0 rounded-lg border border-thor-line object-cover"
              />
              <span className="flex-1 font-mono text-xs text-thor-muted">Posición {i + 1}</span>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => move(i, -1)}
                  disabled={i === 0}
                  className="grid h-8 w-8 place-items-center rounded-md border border-thor-line text-thor-ink disabled:opacity-30"
                  aria-label="Subir"
                >
                  ↑
                </button>
                <button
                  type="button"
                  onClick={() => move(i, 1)}
                  disabled={i === images.length - 1}
                  className="grid h-8 w-8 place-items-center rounded-md border border-thor-line text-thor-ink disabled:opacity-30"
                  aria-label="Bajar"
                >
                  ↓
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(img)}
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
