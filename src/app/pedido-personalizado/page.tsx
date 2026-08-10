import type { Metadata } from "next";
import { PageHeader } from "@/components/PageHeader";
import { whatsappUrl } from "@/lib/site";

export const metadata: Metadata = { title: "Pedido personalizado" };

const PASOS = [
  ["01", "Contanos qué camiseta querés", "Un link o una descripción: equipo, temporada, versión."],
  ["02", "Sumá los detalles", "Tela, talle, parche, número y nombre en la espalda."],
  ["03", "Confirmamos por WhatsApp", "Te pasamos precio final, tiempo de importación y forma de pago."],
];

export default function PedidoPersonalizadoPage() {
  return (
    <>
      <PageHeader
        eyebrow="A tu medida"
        title="Pedido personalizado"
        subtitle="¿No está en el catálogo? La conseguimos igual. Le pasamos tu pedido a nuestros proveedores con la tela, el parche, el número y el nombre que quieras."
      />
      <section className="mx-auto max-w-6xl px-5 py-14">
        <ol className="grid gap-4 sm:grid-cols-3">
          {PASOS.map(([n, t, d]) => (
            <li key={n} className="rounded-2xl border border-thor-line bg-thor-paper p-6">
              <span className="font-display text-2xl text-thor-gold">{n}</span>
              <h3 className="mt-2 font-body text-sm font-extrabold uppercase tracking-wide text-thor-ink">
                {t}
              </h3>
              <p className="mt-1 text-sm text-thor-muted">{d}</p>
            </li>
          ))}
        </ol>

        <div className="mt-10 rounded-2xl border border-dashed border-thor-line bg-thor-cream-2 p-8 text-center">
          <p className="mx-auto max-w-md text-thor-ink-soft">
            El formulario para armar tu pedido con varias camisetas llega pronto.
            Mientras tanto, escribinos por WhatsApp y lo coordinamos al toque.
          </p>
          <a
            href={whatsappUrl("¡Hola Thor! Quiero hacer un pedido personalizado.")}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 inline-block rounded-xl bg-thor-gold px-6 py-3 font-mono text-sm font-bold uppercase tracking-wider text-thor-ink transition-transform hover:-translate-y-0.5"
          >
            Pedir por WhatsApp →
          </a>
        </div>
      </section>
    </>
  );
}
