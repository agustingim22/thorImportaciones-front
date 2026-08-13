import type { Metadata } from "next";
import { PageHeader } from "@/components/PageHeader";
import { PersonalizadoBuilder } from "@/components/PersonalizadoBuilder";
import { getProducts } from "@/lib/products";
import type { Product } from "@/lib/api";

export const metadata: Metadata = {
  title: "Pedido personalizado",
  description: "¿No está en el catálogo? Pedinos la camiseta que buscás y te la conseguimos importada, con la tela, el número y el nombre que quieras.",
  alternates: { canonical: "/pedido-personalizado" },
};

const PASOS = [
  ["01", "Cargá cada camiseta", "Un link o una descripción: equipo, temporada, versión, tela, talle."],
  ["02", "Sumá tus datos", "Contacto y dirección de envío."],
  ["03", "Confirmamos por WhatsApp", "Te pasamos precio final, tiempo de importación y forma de pago."],
];

export default async function PedidoPersonalizadoPage() {
  let products: Product[] = [];
  try {
    products = await getProducts();
  } catch {
    products = [];
  }

  return (
    <>
      <PageHeader
        eyebrow="A tu medida"
        title="Pedido personalizado"
        subtitle="¿No está en el catálogo? La conseguimos igual. Somos importadores: le pasamos tu pedido a nuestros proveedores con la tela, el parche, el número y el nombre que quieras."
      />

      <section className="mx-auto max-w-3xl px-5 pt-12">
        <ol className="grid gap-4 sm:grid-cols-3">
          {PASOS.map(([n, t, d]) => (
            <li key={n} className="rounded-2xl border border-thor-line bg-thor-paper p-5">
              <span className="font-display text-2xl text-thor-gold">{n}</span>
              <h3 className="mt-2 font-body text-sm font-extrabold uppercase tracking-wide text-thor-ink">
                {t}
              </h3>
              <p className="mt-1 text-sm text-thor-muted">{d}</p>
            </li>
          ))}
        </ol>
      </section>

      <PersonalizadoBuilder products={products} />
    </>
  );
}
