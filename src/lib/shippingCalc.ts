/** Sin "server-only": lo usan tanto el carrito (cliente, para mostrar el total) como el servidor. */

export type ShippingSettings = {
  flatCost: number;
  freeShippingThreshold: number | null;
};

/** Costo de envío para un subtotal de productos dado. */
export function computeShippingCost(subtotal: number, settings: ShippingSettings): number {
  if (settings.freeShippingThreshold != null && subtotal >= settings.freeShippingThreshold) return 0;
  return settings.flatCost;
}
