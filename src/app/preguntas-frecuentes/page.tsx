import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/PageHeader";
import { MERCADOPAGO_ENABLED, SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Preguntas frecuentes",
  description: "Envíos, tiempos de importación, formas de pago y todo lo que necesitás saber antes de comprar en Thor Importaciones.",
  alternates: { canonical: "/preguntas-frecuentes" },
};

// Los plazos y el medio de pago salen de la configuración del sitio (lib/site.ts) para que esta página nunca
// contradiga lo que se le muestra al comprador en el carrito y en la ficha.
const SHIPPING_ANSWER =
  SITE.delivery.stock === SITE.delivery.custom
    ? `${SITE.delivery.stock}. Vale tanto para el catálogo como para los pedidos personalizados.`
    : `Catálogo: ${SITE.delivery.stock}. Pedidos personalizados: ${SITE.delivery.custom}.`;

const PAYMENT_ANSWER = MERCADOPAGO_ENABLED
  ? "Catálogo: Mercado Pago o transferencia dentro del sitio. Personalizados: coordinamos el pago por WhatsApp una vez confirmado el pedido de importación."
  : "Catálogo: transferencia bancaria. Al hacer el pedido te mostramos los datos y subís el comprobante en el sitio. Personalizados: coordinamos el pago por WhatsApp una vez confirmado el pedido de importación.";

const FAQS: [string, string][] = [
  ["¿Cuánto tarda el envío?", SHIPPING_ANSWER],
  [
    "¿Puedo pedir una camiseta que no está en la web?",
    "Sí, para eso está la sección Pedido personalizado: nos pasás una referencia y te la conseguimos con nuestros proveedores, con la tela, el número y el nombre que quieras.",
  ],
  [
    "¿Qué diferencia hay entre Fan y Player?",
    "Fan es un corte más holgado en poliéster clásico. Player es slim fit, en tela dry-fit, igual a la que usan los jugadores en cancha.",
  ],
  [
    "¿Hacen cambios de talle?",
    "Sí, dentro de las 72 hs de recibido y sin uso, para camisetas de catálogo. Los pedidos personalizados no tienen cambio de talle porque se importan puntualmente.",
  ],
  ["¿Cómo pago?", PAYMENT_ANSWER],
];

export default function FaqPage() {
  return (
    <>
      <PageHeader
        eyebrow="Ayuda"
        title="Preguntas frecuentes"
        subtitle="Lo que más nos consultan. Si te queda alguna duda, escribinos por WhatsApp."
      />
      <section className="mx-auto max-w-3xl px-5 py-14">
        <div className="divide-y divide-thor-line rounded-2xl border border-thor-line bg-thor-paper">
          {FAQS.map(([q, a]) => (
            <details key={q} className="group px-5 py-4">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-body font-bold text-thor-ink">
                {q}
                <span className="font-mono text-thor-gold transition-transform group-open:rotate-45">
                  +
                </span>
              </summary>
              <p className="mt-3 text-sm text-thor-muted">
                {a}
                {q.includes("Fan y Player") && (
                  <>
                    {" "}
                    <Link href="/guia-de-versiones" className="text-thor-gold underline">
                      Ver la guía completa
                    </Link>
                    .
                  </>
                )}
              </p>
            </details>
          ))}
        </div>
      </section>
    </>
  );
}
