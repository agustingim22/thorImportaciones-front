import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/PageHeader";
import { whatsappUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "Sobre nosotros",
  description:
    "Somos Thor Importaciones: importamos camisetas de fútbol retro y versión jugador de todo el mundo, y armamos pedidos personalizados con la tela, el número y el nombre que quieras.",
  alternates: { canonical: "/sobre-nosotros" },
};

const VALUES = [
  {
    icon: "🌍",
    title: "Importación directa",
    text: "Traemos cada camiseta desde el proveedor, sin intermediarios que encarezcan el precio.",
  },
  {
    icon: "🧵",
    title: "Hecha a tu medida",
    text: "Elegís la tela, el número, el nombre y el parche. Si no está en el catálogo, te la conseguimos igual.",
  },
  {
    icon: "💬",
    title: "Trato de persona a persona",
    text: "Coordinamos todo por WhatsApp: dudas, talles, tiempos de importación y forma de pago.",
  },
  {
    icon: "📦",
    title: "Envíos a todo el país",
    text: "Sea Retro, NBA, rugby o un conjunto deportivo, te llega esté donde estés.",
  },
];

export default function SobreNosotrosPage() {
  return (
    <>
      <PageHeader
        eyebrow="Quiénes somos"
        title="Fútbol importado, con atención de verdad"
        subtitle="Somos un equipo chico que arrancó por una razón simple: nos costaba encontrar acá las camisetas que buscábamos."
      />

      <section className="mx-auto max-w-3xl px-5 py-14">
        <div className="flex flex-col gap-5 text-lg leading-relaxed text-thor-ink-soft">
          <p>
            Thor Importaciones nació de ser hinchas antes que vendedores. Esa camiseta retro que
            nunca llegó a las tiendas locales, esa versión jugador de una temporada puntual, ese
            equipo que en Argentina casi nadie tiene: son las camisetas que nosotros mismos
            queríamos y no encontrábamos. Así que empezamos a importarlas directamente, primero
            para nosotros y después para quien las estuviera buscando también.
          </p>
          <p>
            Hoy trabajamos con proveedores en distintas partes del mundo para traer camisetas de
            fútbol retro y versión jugador, además de NBA, rugby, remeras y conjuntos deportivos.
            Tenemos catálogo en stock listo para enviar, y si lo que buscás no está, armamos un
            pedido personalizado: elegís la tela, el número, el nombre en la espalda y el parche,
            y lo coordinamos por WhatsApp de punta a punta.
          </p>
          <p>
            No somos una cadena ni un call center: somos las mismas personas que responden tus
            mensajes, arman tu pedido y lo empaquetan. Preferimos que la compra se sienta así.
          </p>
        </div>
      </section>

      <section className="border-y border-thor-line bg-thor-cream-2">
        <div className="mx-auto max-w-6xl px-5 py-14">
          <h2 className="font-display text-2xl tracking-wide text-thor-ink sm:text-3xl">
            Cómo trabajamos
          </h2>
          <div className="mt-8 grid gap-5 sm:grid-cols-2">
            {VALUES.map((v) => (
              <div
                key={v.title}
                className="flex gap-4 rounded-2xl border border-thor-line bg-thor-paper p-5"
              >
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-thor-cream-2 text-xl">
                  {v.icon}
                </span>
                <div>
                  <h3 className="font-body text-sm font-extrabold text-thor-ink">{v.title}</h3>
                  <p className="mt-1 text-sm text-thor-ink-soft">{v.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-16 text-center">
        <h2 className="font-display text-3xl tracking-wide text-thor-ink sm:text-4xl">
          ¿Buscás una camiseta puntual?
        </h2>
        <p className="mx-auto mt-3 max-w-lg text-thor-ink-soft">
          Contanos qué estás buscando y vemos cómo conseguírtela.
        </p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <Link
            href="/catalogo"
            className="rounded-xl bg-thor-gold px-6 py-3 font-mono text-sm font-bold uppercase tracking-wider text-thor-ink transition-transform hover:-translate-y-0.5"
          >
            Ver catálogo
          </Link>
          <a
            href={whatsappUrl("¡Hola Thor! Quería saber más sobre ustedes.")}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-xl border border-thor-line px-6 py-3 font-mono text-sm font-bold uppercase tracking-wider text-thor-ink transition-colors hover:border-thor-gold hover:bg-thor-gold/10"
          >
            Escribinos por WhatsApp
          </a>
        </div>
      </section>
    </>
  );
}
