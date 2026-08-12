import type { Metadata } from "next";
import { PageHeader } from "@/components/PageHeader";
import { SITE, whatsappUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "Contacto",
  description: "Escribinos por WhatsApp, Instagram o email. Respondemos consultas sobre pedidos, envíos y camisetas personalizadas.",
  alternates: { canonical: "/contacto" },
};

export default function ContactoPage() {
  const cards = [
    { icon: "💬", title: "WhatsApp", sub: "Respuesta en el día", href: whatsappUrl() },
    { icon: "📷", title: "Instagram", sub: "@thorimportaciones", href: SITE.instagram },
    { icon: "✉️", title: "Email", sub: SITE.email, href: `mailto:${SITE.email}` },
    { icon: "📍", title: "Envíos", sub: "A todo el país", href: whatsappUrl() },
  ];
  return (
    <>
      <PageHeader
        eyebrow="Estamos para ayudarte"
        title="Hablemos"
        subtitle="¿Una duda antes de comprar, un problema con un pedido o una idea para tu próxima camiseta? Escribinos."
      />
      <section className="mx-auto max-w-6xl px-5 py-14">
        <div className="grid gap-4 sm:grid-cols-2">
          {cards.map((c) => (
            <a
              key={c.title}
              href={c.href}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-4 rounded-2xl border border-thor-line bg-thor-paper p-5 transition-colors hover:border-thor-gold"
            >
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-thor-cream-2 text-xl">
                {c.icon}
              </span>
              <span>
                <span className="block font-body text-sm font-extrabold text-thor-ink">
                  {c.title}
                </span>
                <span className="block text-xs text-thor-muted">{c.sub}</span>
              </span>
            </a>
          ))}
        </div>
      </section>
    </>
  );
}
