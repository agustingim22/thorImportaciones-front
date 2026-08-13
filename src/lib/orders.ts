export type ShippingAddress = {
  street: string;
  postalCode: string;
  city: string;
  province: string;
  floor: string;
  apartment: string;
  deliveryNotes: string;
};

export type OrderItemInput = {
  productId: number;
  quantity: number;
  size: string;
  customName?: string | null;
  customNumber?: string | null;
  patchId?: number | null;
};

export type CreateOrderPayload = ShippingAddress & {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  paymentMethod: "MercadoPago" | "Transfer";
  items: OrderItemInput[];
};

export type CreateOrderResult = {
  orderId: string;
  total: number;
  status: string;
  paymentMethod: "MercadoPago" | "Transfer";
  checkoutUrl: string | null;
};

export async function createOrder(payload: CreateOrderPayload): Promise<CreateOrderResult> {
  const res = await fetch(`/api/orders`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    let msg = `Error ${res.status}`;
    try {
      const data = await res.json();
      if (data?.errors) {
        msg = Object.values(data.errors as Record<string, string[]>).flat().join(" ");
      } else if (data?.error) {
        msg = data.error;
      }
    } catch {
      /* sin cuerpo */
    }
    throw new Error(msg);
  }
  return res.json();
}

/** Sube el comprobante de transferencia de un pedido. */
export async function uploadReceipt(orderId: string, file: File): Promise<string> {
  const fd = new FormData();
  fd.append("file", file);
  const res = await fetch(`/api/orders/${orderId}/receipt`, { method: "POST", body: fd });
  if (!res.ok) {
    let msg = `Error ${res.status}`;
    try {
      const data = await res.json();
      if (data?.error) msg = data.error;
    } catch {
      /* sin cuerpo */
    }
    throw new Error(msg);
  }
  const data = (await res.json()) as { url: string };
  return data.url;
}

export type CustomItemInput = {
  reference: string;
  referenceImageUrl: string;
  fabric: string;
  size: string;
  patch: string;
  number: string;
  name: string;
};

/** Sube una foto de referencia para un ítem de pedido personalizado. */
export async function uploadCustomOrderImage(file: File): Promise<string> {
  const fd = new FormData();
  fd.append("file", file);
  const res = await fetch(`/api/custom-orders/upload-image`, { method: "POST", body: fd });
  if (!res.ok) {
    let msg = `Error ${res.status}`;
    try {
      const data = await res.json();
      if (data?.error) msg = data.error;
    } catch {
      /* sin cuerpo */
    }
    throw new Error(msg);
  }
  const data = (await res.json()) as { url: string };
  return data.url;
}

export type CustomOrderPayload = ShippingAddress & {
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  notes: string;
  items: CustomItemInput[];
};

/** Crea un pedido personalizado "en stand by". Devuelve el número de pedido. */
export async function createCustomOrder(payload: CustomOrderPayload): Promise<string> {
  const res = await fetch(`/api/custom-orders`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    let msg = `Error ${res.status}`;
    try {
      const data = await res.json();
      if (data?.errors) msg = Object.values(data.errors as Record<string, string[]>).flat().join(" ");
    } catch {
      /* sin cuerpo */
    }
    throw new Error(msg);
  }
  const data = (await res.json()) as { orderId: string };
  return data.orderId;
}

export type OrderStatus = {
  orderId: string;
  status: string;
  total: number;
  createdAt: string;
  items: { productName: string; unitPrice: number; quantity: number; size: string | null }[];
};

export async function getOrder(orderId: string): Promise<OrderStatus> {
  const res = await fetch(`/api/orders/${orderId}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`Error ${res.status}`);
  return res.json();
}

/** Sincroniza el pago desde Mercado Pago al volver del checkout. */
export async function syncPayment(paymentId: string): Promise<void> {
  await fetch(`/api/orders/sync`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ paymentId }),
  });
}
