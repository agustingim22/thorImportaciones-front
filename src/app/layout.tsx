import type { Metadata } from "next";
import { Anton, Manrope, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { WhatsAppFloat } from "@/components/WhatsAppFloat";
import { CartProvider } from "@/lib/cart";
import { AuthProvider } from "@/lib/auth";
import { FavoritesProvider } from "@/lib/favorites";
import { SITE, SITE_URL } from "@/lib/site";

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
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE.name} — ${SITE.tagline}`,
    template: `%s — ${SITE.name}`,
  },
  description:
    "Importamos camisetas de fútbol retro y versión jugador de todo el mundo. Catálogo en stock y pedidos personalizados con la tela, el número y el nombre que quieras.",
  keywords: [
    "camisetas de fútbol",
    "camisetas retro",
    "camisetas version jugador",
    "importación de camisetas",
    "camisetas personalizadas",
    "indumentaria de fútbol Argentina",
  ],
  alternates: { canonical: "/" },
  openGraph: {
    title: `${SITE.name} — ${SITE.tagline}`,
    description:
      "Camisetas de fútbol retro y versión jugador, importadas. Catálogo en stock y pedidos personalizados.",
    url: "/",
    siteName: SITE.name,
    type: "website",
    locale: "es_AR",
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE.name} — ${SITE.tagline}`,
    description:
      "Camisetas de fútbol retro y versión jugador, importadas. Catálogo en stock y pedidos personalizados.",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: SITE.name,
  url: SITE_URL,
  logo: `${SITE_URL}/opengraph-image`,
  email: SITE.email,
  sameAs: [SITE.instagram],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      className={`${anton.variable} ${manrope.variable} ${jetbrains.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-thor-cream text-thor-ink">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <AuthProvider>
          <CartProvider>
            <FavoritesProvider>
              <Nav />
              <main className="flex-1">{children}</main>
              <Footer />
              <WhatsAppFloat />
            </FavoritesProvider>
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
