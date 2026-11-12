/**
 * Reparte un descuento entre las líneas de un pedido, para los medios de pago que solo aceptan precios de
 * ítems (Mercado Pago no admite precios negativos). Proporcional al valor de cada línea; el resto de redondeo
 * lo absorbe la última, así la suma de las líneas da EXACTAMENTE subtotal − descuento.
 *
 * Devuelve el total de cada línea (ya multiplicado por la cantidad). Pura y sin "server-only" para poder probarla.
 */
export function allocateDiscount(
  lines: { unitPrice: number; quantity: number }[],
  discount: number,
): number[] {
  const totals = lines.map((l) => l.unitPrice * l.quantity);
  const subtotal = totals.reduce((a, b) => a + b, 0);
  const d = Math.max(0, Math.min(Math.round(discount), subtotal));
  if (d === 0 || subtotal === 0) return totals;

  const result: number[] = [];
  let allocated = 0;
  totals.forEach((t, i) => {
    if (i === totals.length - 1) {
      result.push(t - (d - allocated)); // lo que falta para llegar al descuento exacto
    } else {
      const share = Math.round((t * d) / subtotal);
      allocated += share;
      result.push(t - share);
    }
  });
  return result;
}
