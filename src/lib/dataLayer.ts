declare global {
  interface Window {
    dataLayer?: unknown[];
  }
}

export type EcommerceItem = {
  item_id: string;
  item_name: string;
  price?: number;
  quantity?: number;
};

type EcommercePayload = {
  currency: "ARS";
  value?: number;
  transaction_id?: string;
  items: EcommerceItem[];
};

/**
 * Dispara un evento de ecommerce (esquema GA4) al dataLayer de GTM, para que
 * Analytics/Ads puedan medir conversiones. No hace nada si GTM no está activo.
 */
export function pushEcommerceEvent(event: string, ecommerce: EcommercePayload): void {
  if (typeof window === "undefined" || !window.dataLayer) return;
  // Limpia el objeto ecommerce anterior antes de empujar el nuevo (recomendado por GA4,
  // evita que GTM mezcle items de un evento con el siguiente).
  window.dataLayer.push({ ecommerce: null });
  window.dataLayer.push({ event, ecommerce });
}
