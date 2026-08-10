import type { Metadata } from "next";
import { Anton, Manrope, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { WhatsAppFloat } from "@/components/WhatsAppFloat";
import { CartProvider } from "@/lib/cart";
import { SITE } from "@/lib/site";

const anton = Anton({
  weight: "400",
  variable: "--font-anton",
  subsets: ["latin"],
  display: "swap",
});
const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  display: "swap",
});
const jetbrains = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: `${SITE.name} — ${SITE.tagline}`,
    template: `%s — ${SITE.name}`,
  },
  description:
    "Importamos camisetas de fútbol retro y versión jugador de todo el mundo. Catálogo en stock y pedidos personalizados con la tela, el número y el nombre que quieras.",
  openGraph: {
    title: `${SITE.name} — ${SITE.tagline}`,
    description:
      "Camisetas de fútbol retro y versión jugador, importadas. Catálogo en stock y pedidos personalizados.",
    type: "website",
    locale: "es_AR",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      className={`${anton.variable} ${manrope.variable} ${jetbrains.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-thor-cream text-thor-ink">
        <CartProvider>
          <Nav />
          <main className="flex-1">{children}</main>
          <Footer />
          <WhatsAppFloat />
        </CartProvider>
      </body>
    </html>
  );
}
