import Link from "next/link";
import { Logo } from "./Logo";
import { SITE } from "@/lib/site";
import { NewsletterForm } from "./NewsletterForm";

const LINKS = [
  { href: "/camisetas", label: "Camisetas" },
  { href: "/talles", label: "Guía de talles" },
  { href: "/preguntas-frecuentes", label: "Preguntas frecuentes" },
  { href: "/pedido", label: "Seguir mi pedido" },
  { href: "/contacto", label: "Contacto" },
];

export function Footer() {
  return (
    <footer className="border-t border-thor-line bg-thor-cream-2">
      <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 px-5 py-10 sm:flex-row sm:items-center">
        <Logo />
        <nav className="flex flex-wrap gap-x-6 gap-y-2">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="font-mono text-xs uppercase tracking-wider text-thor-muted hover:text-thor-gold"
            >
              {l.label}
            </Link>
          ))}
        </nav>
      </div>
      <div className="border-t border-thor-line/70">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-5 py-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-mono text-xs uppercase tracking-wider text-thor-ink">
            Enterate de camisetas nuevas y promos
          </p>
          <NewsletterForm />
        </div>
      </div>
      <div className="border-t border-thor-line/70">
        <p className="mx-auto max-w-6xl px-5 py-4 font-mono text-[11px] text-thor-muted">
          © {new Date().getFullYear()} {SITE.name} — Importamos camisetas de fútbol de todo el mundo.
        </p>
      </div>
    </footer>
  );
}
