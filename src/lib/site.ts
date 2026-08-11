/**
 * Configuración central del sitio. Cambiá acá los datos reales (WhatsApp, redes)
 * y se actualizan en todo el sitio.
 */
export const SITE = {
  name: "Thor Importaciones",
  tagline: "Camisetas de fútbol",
  // Número de WhatsApp del negocio (formato internacional sin +).
  whatsappNumber: "5493564578649",
  instagram: "https://instagram.com/thorcamisetas",
  email: "hola@thorimportaciones.com",
} as const;

/** Arma un link de WhatsApp con un mensaje opcional prellenado. */
export function whatsappUrl(message?: string): string {
  const base = `https://wa.me/${SITE.whatsappNumber}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}
