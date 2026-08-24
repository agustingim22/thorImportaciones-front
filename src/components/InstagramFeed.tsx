"use client";

import { useEffect } from "react";
import Script from "next/script";
import { SITE } from "@/lib/site";

declare global {
  interface Window {
    instgrm?: { Embeds: { process: () => void } };
  }
}

/** Posts de Instagram elegidos a mano por el admin (sin token/API de Meta), embebidos
 *  con el script oficial de Instagram. No renderiza nada si no hay ningún post cargado. */
export function InstagramFeed({ urls }: { urls: string[] }) {
  useEffect(() => {
    window.instgrm?.Embeds.process();
  }, [urls]);

  if (urls.length === 0) return null;

  return (
    <section className="border-t border-thor-line bg-thor-cream-2">
      <div className="mx-auto max-w-6xl px-5 py-16">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-3xl tracking-wide text-thor-ink sm:text-4xl">
              Seguinos en Instagram
            </h2>
            <p className="mt-1 text-sm text-thor-muted">@thorimportaciones</p>
          </div>
          <a
            href={SITE.instagram}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg border border-thor-line px-4 py-2 font-mono text-xs font-bold uppercase tracking-wider text-thor-ink hover:border-thor-gold hover:bg-thor-gold/10"
          >
            Seguir →
          </a>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {urls.map((url) => (
            <blockquote
              key={url}
              className="instagram-media"
              data-instgrm-permalink={url}
              data-instgrm-version="14"
              style={{ margin: 0, width: "100%" }}
            />
          ))}
        </div>
      </div>

      <Script
        async
        src="https://www.instagram.com/embed.js"
        strategy="lazyOnload"
        onReady={() => window.instgrm?.Embeds.process()}
      />
    </section>
  );
}
