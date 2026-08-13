"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import type { HeroImage } from "@/lib/heroImages";

const ROTATE_MS = 4500;

export function HeroCarousel({ images }: { images: HeroImage[] }) {
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (images.length < 2) return;
    const t = setInterval(() => setActive((i) => (i + 1) % images.length), ROTATE_MS);
    return () => clearInterval(t);
  }, [images.length]);

  if (images.length === 0) {
    return (
      <div className="relative flex h-72 items-center justify-center md:h-96">
        <div
          className="jersey-shape flex h-64 w-56 items-center justify-center shadow-2xl shadow-black/10 md:h-80 md:w-72"
          style={{ background: "linear-gradient(160deg,#FFC44D,#DE9A26)" }}
        >
          <span className="font-display text-8xl text-thor-ink/80">10</span>
        </div>
        <div className="absolute bottom-4 right-2 rounded-xl border border-thor-line bg-thor-paper px-4 py-3 font-mono text-[11px] text-thor-muted shadow-lg md:right-0">
          <span className="block font-display text-sm tracking-wide text-thor-ink">
            RETRO 1986
          </span>
          THOR · Poliéster clásico
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex h-72 items-center justify-center md:h-96">
      <div className="relative h-64 w-64 overflow-hidden rounded-3xl bg-thor-cream-2 shadow-2xl shadow-black/10 md:h-80 md:w-80">
        {images.map((img, i) => (
          <Image
            key={img.id}
            src={img.imageUrl}
            alt=""
            fill
            priority={i === 0}
            sizes="(max-width: 768px) 256px, 320px"
            className={`object-contain transition-opacity duration-700 ${
              i === active ? "opacity-100" : "opacity-0"
            }`}
          />
        ))}
      </div>

      {images.length > 1 && (
        <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
          {images.map((img, i) => (
            <button
              key={img.id}
              type="button"
              onClick={() => setActive(i)}
              aria-label={`Ver foto ${i + 1}`}
              className={`h-1.5 rounded-full transition-all ${
                i === active ? "w-5 bg-thor-gold" : "w-1.5 bg-thor-paper/80"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
