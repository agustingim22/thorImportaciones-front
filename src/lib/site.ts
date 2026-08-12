/**
 * Configuración central del sitio. Cambiá acá los datos reales (WhatsApp, redes)
 * y se actualizan en todo el sitio.
 */
export const SITE = {
  name: "Thor Importaciones",
  tagline: "Camisetas de fútbol",
  // Número de WhatsApp del negocio (formato internacional sin +).
  whatsappNumber: "5493564578649",
  instagram: "https://instagram.com/thorimportaciones",
  email: "hola@thorimportaciones.com",
  // Datos para transferencias. cvu es opcional (dejalo en null si preferís
  // que solo se muestre el alias).
  bank: {
    cvu: "0000168300000008337465",
    alias: "AGUSTINGIM22.LEMON",
    holder: "Agustín Alejandro Gimenez",
  },
} as const;

/** URL pública del sitio, sin slash final (para sitemap, robots, canonical, JSON-LD). */
export const SITE_URL = (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(
  /\/$/,
  "",
);

/** Arma un link de WhatsApp con un mensaje opcional prellenado. */
export function whatsappUrl(message?: string): string {
  const base = `https://wa.me/${SITE.whatsappNumber}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}
