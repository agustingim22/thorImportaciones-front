import type { Metadata } from "next";
import { PageHeader } from "@/components/PageHeader";
import { whatsappUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "Guía de talles",
  description: "Tabla de talles para camisetas de fútbol fan y player version: largo, ancho y contextura recomendada.",
  alternates: { canonical: "/talles" },
};

const SIZES: Record<"fan" | "player", [string, string, string, string][]> = {
  fan: [
    ["S", "94", "68", "Delgada"],
    ["M", "100", "70", "Media"],
    ["L", "106", "72", "Media-robusta"],
    ["XL", "112", "74", "Robusta"],
    ["XXL", "118", "76", "Extra robusta"],
    ["3XL / 4XL", "Consultanos", "Consultanos", "Disponible en camisetas seleccionadas"],
  ],
  player: [
    ["S", "90", "66", "Ajustado, delgada"],
    ["M", "96", "68", "Ajustado, media"],
    ["L", "102", "70", "Ajustado, media-robusta"],
    ["XL", "108", "72", "Ajustado, robusta"],
    ["XXL", "114", "74", "Ajustado, extra robusta"],
    ["3XL / 4XL", "Consultanos", "Consultanos", "Disponible en camisetas seleccionadas"],
  ],
};

function SizeTable({ title, rows }: { title: string; rows: [string, string, string, string][] }) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-thor-line bg-thor-paper">
      <div className="border-b border-thor-line px-5 py-3">
        <h3 className="font-body text-sm font-extrabold uppercase tracking-wide text-thor-ink">
          {title}
        </h3>
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left font-mono text-[11px] uppercase tracking-wide text-thor-muted">
            <th className="px-5 py-3">Talle</th>
            <th className="px-5 py-3">Ancho (cm)</th>
            <th className="px-5 py-3">Largo (cm)</th>
            <th className="px-5 py-3">Contextura</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(([t, ancho, largo, ctx]) => (
            <tr key={t} className="border-t border-thor-line">
              <td className="px-5 py-3 font-bold text-thor-gold">{t}</td>
              <td className="px-5 py-3 tabular-nums text-thor-ink">{ancho}</td>
              <td className="px-5 py-3 tabular-nums text-thor-ink">{largo}</td>
              <td className="px-5 py-3 text-thor-muted">{ctx}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function TallesPage() {
  return (
    <>
      <PageHeader
        eyebrow="Antes de comprar"
        title="Guía de talles"
        subtitle="Medidas aproximadas de la prenda apoyada en plano (no del cuerpo). Ante la duda, escribinos y te ayudamos a elegir."
      />
      <section className="mx-auto max-w-6xl px-5 py-14">
        <div className="grid gap-6 lg:grid-cols-2">
          <SizeTable title="Retro Fan — corte holgado" rows={SIZES.fan} />
          <SizeTable title="Player Version — slim fit" rows={SIZES.player} />
        </div>
        <p className="mt-6 text-sm text-thor-muted">
          Algunas camisetas también están disponibles en 3XL y 4XL.{" "}
          <a
            href={whatsappUrl("¡Hola Thor! Quería consultar las medidas exactas de talle 3XL/4XL.")}
            target="_blank"
            rel="noopener noreferrer"
            className="text-thor-gold underline"
          >
            Escribinos por WhatsApp
          </a>{" "}
          y te pasamos la medida exacta antes de comprar.
        </p>
      </section>
    </>
  );
}
