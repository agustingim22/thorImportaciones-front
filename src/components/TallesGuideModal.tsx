"use client";

import { TallesGuideContent } from "./TallesGuide";

export function TallesGuideModal({
  category,
  onClose,
}: {
  category: string;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="mt-10 w-full max-w-3xl rounded-2xl border border-thor-line bg-thor-cream p-6"
      >
        <div className="flex items-center justify-between">
          <h2 className="font-display text-2xl tracking-wide text-thor-ink">Guía de talles</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="grid h-9 w-9 place-items-center rounded-full text-thor-muted hover:bg-thor-cream-2 hover:text-thor-ink"
          >
            ✕
          </button>
        </div>
        <div className="mt-4">
          <TallesGuideContent initialCategory={category} />
        </div>
      </div>
    </div>
  );
}
