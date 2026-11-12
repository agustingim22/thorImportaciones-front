import "server-only";
import { allocateDiscount } from "@/lib/discountAllocation";

const API = "https://api.mercadopago.com";

type OrderForPreference = {
  publicId: string;
  customerName: string;
  customerEmail: string;
  items: { productName: string; unitPrice: number; quantity: number }[];
  shippingCost: number;
  discountAmount?: number; // cupón o combo ya aplicado al pedido
};

export function isMpConfigured(): boolean {
  return !!process.env.MERCADOPAGO_ACCESS_TOKEN;
}

function appBase(): string {
  return (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
}

/** Crea la preferencia de Checkout Pro y devuelve la URL de pago (init_point). */
export async function createPreference(order: OrderForPreference): Promise<string> {
  const token = process.env.MERCADOPAGO_ACCESS_TOKEN;
  const back = `${appBase()}/checkout/resultado?order=${order.publicId}`;

  // Mercado Pago cobra la suma de los ítems y no admite precios negativos, así que el descuento (cupón o combo)
  // se reparte entre las líneas. Si el total de una línea no se divide justo por su cantidad, va como un único
  // ítem con el total de la línea: así el cobro coincide al peso con el total del pedido.
  const lineTotals = allocateDiscount(order.items, order.discountAmount ?? 0);
  const items = order.items.map((i, idx) =>
    lineTotals[idx] % i.quantity === 0
      ? { title: i.productName, quantity: i.quantity, unit_price: lineTotals[idx] / i.quantity, currency_id: "ARS" }
      : { title: `${i.productName} (x${i.quantity})`, quantity: 1, unit_price: lineTotals[idx], currency_id: "ARS" },
  );
  if (order.shippingCost > 0) {
    items.push({ title: "Envío", quantity: 1, unit_price: order.shippingCost, currency_id: "ARS" });
  }

  const body: Record<string, unknown> = {
    items,
    payer: { name: order.customerName, email: order.customerEmail },
    external_reference: order.publicId,
    back_urls: { success: back, failure: back, pending: back },
    auto_return: "approved",
  };
  if (process.env.MERCADOPAGO_WEBHOOK_URL) {
    body.notification_url = process.env.MERCADOPAGO_WEBHOOK_URL;
  }

  const res = await fetch(`${API}/checkout/preferences`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Mercado Pago ${res.status}: ${await res.text()}`);
  const data = (await res.json()) as { init_point: string };
  return data.init_point;
}

/** Consulta un pago en Mercado Pago (fuente autoritativa del estado). */
export async function getPayment(
  paymentId: string,
): Promise<{ status: string; externalReference: string | null }> {
  const token = process.env.MERCADOPAGO_ACCESS_TOKEN;
  const res = await fetch(`${API}/v1/payments/${paymentId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`Mercado Pago ${res.status}`);
  const data = (await res.json()) as { status: string; external_reference?: string };
  return { status: data.status, externalReference: data.external_reference ?? null };
}
