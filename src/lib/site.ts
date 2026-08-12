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
  // TODO: reemplazar por los datos reales de la cuenta bancaria del negocio.
  bank: {
    cvu: "0000003100000000000000",
    alias: "THOR.IMPORTA.CIONES",
    holder: "Thor Importaciones",
  },
} as const;

/** Arma un link de WhatsApp con un mensaje opcional prellenado. */
export function whatsappUrl(message?: string): string {
  const base = `https://wa.me/${SITE.whatsappNumber}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}
