/**
 * Configuración central del sitio. Cambiá acá los datos reales (WhatsApp, redes)
 * y se actualizan en todo el sitio.
 */
export const SITE = {
  name: "Thor Importaciones",
  tagline: "Camisetas de fútbol",
  // TODO: reemplazar por el número real (formato internacional sin +, ej 54911...).
  whatsappNumber: "5491100000000",
  instagram: "https://instagram.com/thorcamisetas",
  email: "hola@thorimportaciones.com",
} as const;

/** Arma un link de WhatsApp con un mensaje opcional prellenado. */
export function whatsappUrl(message?: string): string {
  const base = `https://wa.me/${SITE.whatsappNumber}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}
