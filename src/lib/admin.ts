"use client";

import type { Product, ProductType } from "./api";
import type { ShippingSettings } from "./shippingCalc";

const TOKEN_KEY = "thor-admin-token";

export type PatchInput = {
  label: string;
  imageUrl: string;
  extraPrice: number;
};

export type ProductInput = {
  team: string;
  type: ProductType;
  price: number;
  salePrice: number | null;
  colorCss: string;
  images: string[]; // hasta 3 fotos
  description: string;
  presetName: string | null;
  presetNumber: string | null;
  patches: PatchInput[];
  sizes: string[];
  sizeStock: Record<string, number>; // unidades disponibles por talle
  slug: string | null;
};

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_KEY);
}
export function setToken(token: string) {
  window.localStorage.setItem(TOKEN_KEY, token);
}
export function clearToken() {
  window.localStorage.removeItem(TOKEN_KEY);
}

function authHeaders(): HeadersInit {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${getToken() ?? ""}`,
  };
}

/** Valida el token contra la API. */
export async function adminPing(token: string): Promise<boolean> {
  const res = await fetch(`/api/admin/ping`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.ok;
}

export async function adminListProducts(): Promise<Product[]> {
  const res = await fetch(`/api/admin/products`, {
    headers: authHeaders(),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Error ${res.status}`);
  return res.json();
}

/** Devuelve el producto creado, o lanza con los mensajes de validación. */
export async function adminCreateProduct(input: ProductInput): Promise<Product> {
  const res = await fetch(`/api/admin/products`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(input),
  });
  if (!res.ok) throw await toError(res);
  return res.json();
}

export async function adminUpdateProduct(id: number, input: ProductInput): Promise<Product> {
  const res = await fetch(`/api/admin/products/${id}`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify(input),
  });
  if (!res.ok) throw await toError(res);
  return res.json();
}

/** Sube una imagen a la API (que la reenvía a Cloudinary) y devuelve la URL. */
export async function adminUploadImage(file: File): Promise<string> {
  const fd = new FormData();
  fd.append("file", file);
  const res = await fetch(`/api/admin/upload`, {
    method: "POST",
    // Sin Content-Type: el navegador pone el boundary de multipart automáticamente.
    headers: { Authorization: `Bearer ${getToken() ?? ""}` },
    body: fd,
  });
  if (!res.ok) throw await toError(res);
  const data = (await res.json()) as { url: string };
  return data.url;
}

export async function adminDeleteProduct(id: number): Promise<void> {
  const res = await fetch(`/api/admin/products/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error(`Error ${res.status}`);
}

// ---- Pedidos ----
export type AdminOrderItem = {
  productName: string;
  unitPrice: number;
  quantity: number;
  size: string | null;
  customName: string | null;
  customNumber: string | null;
  patchLabel: string | null;
  patchExtraPrice: number | null;
};
export type AdminCustomItem = {
  reference: string;
  referenceImageUrl: string | null;
  fabric: string;
  size: string;
  patch: string | null;
  number: string | null;
  name: string | null;
};
export type AdminOrder = {
  publicId: string;
  kind: "Stock" | "Custom";
  status: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  street: string;
  postalCode: string;
  city: string;
  province: string;
  floor: string | null;
  apartment: string | null;
  deliveryNotes: string | null;
  notes: string | null;
  total: number;
  shippingCost: number;
  paymentMethod: string | null;
  receiptUrl: string | null;
  trackingNumber: string | null;
  isGift: boolean;
  giftMessage: string | null;
  createdAt: string;
  items: AdminOrderItem[];
  customItems: AdminCustomItem[];
};

export async function adminListOrders(): Promise<AdminOrder[]> {
  const res = await fetch(`/api/admin/orders`, { headers: authHeaders(), cache: "no-store" });
  if (!res.ok) throw new Error(`Error ${res.status}`);
  return res.json();
}

export async function adminSetOrderStatus(publicId: string, status: string): Promise<void> {
  const res = await fetch(`/api/admin/orders/${publicId}/status`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ status }),
  });
  if (!res.ok) throw new Error(`Error ${res.status}`);
}

/** Fija el precio final de un pedido personalizado (coordinado por WhatsApp). */
export async function adminSetOrderTotal(publicId: string, total: number): Promise<void> {
  const res = await fetch(`/api/admin/orders/${publicId}/status`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ total }),
  });
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
}

/** Carga o cambia el código de seguimiento del envío de un pedido. */
export async function adminSetOrderTracking(publicId: string, trackingNumber: string): Promise<void> {
  const res = await fetch(`/api/admin/orders/${publicId}/status`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ trackingNumber }),
  });
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
}

// ---- Testimonios ----
export type AdminTestimonial = {
  id: number;
  name: string;
  comment: string;
  rating: number;
  published: boolean;
  createdAt: string;
};
export type TestimonialInput = {
  name: string;
  comment: string;
  rating: number;
  published: boolean;
};

export async function adminListTestimonials(): Promise<AdminTestimonial[]> {
  const res = await fetch(`/api/admin/testimonials`, { headers: authHeaders(), cache: "no-store" });
  if (!res.ok) throw new Error(`Error ${res.status}`);
  return res.json();
}

export async function adminCreateTestimonial(input: TestimonialInput): Promise<AdminTestimonial> {
  const res = await fetch(`/api/admin/testimonials`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(input),
  });
  if (!res.ok) throw await toError(res);
  return res.json();
}

export async function adminUpdateTestimonial(
  id: number,
  input: TestimonialInput,
): Promise<AdminTestimonial> {
  const res = await fetch(`/api/admin/testimonials/${id}`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify(input),
  });
  if (!res.ok) throw await toError(res);
  return res.json();
}

export async function adminDeleteTestimonial(id: number): Promise<void> {
  const res = await fetch(`/api/admin/testimonials/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error(`Error ${res.status}`);
}

// ---- Carrusel de portada ----
export type AdminHeroImage = {
  id: number;
  imageUrl: string;
  position: number;
  createdAt: string;
};

export async function adminListHeroImages(): Promise<AdminHeroImage[]> {
  const res = await fetch(`/api/admin/hero-images`, { headers: authHeaders(), cache: "no-store" });
  if (!res.ok) throw new Error(`Error ${res.status}`);
  return res.json();
}

export async function adminCreateHeroImage(imageUrl: string): Promise<AdminHeroImage> {
  const res = await fetch(`/api/admin/hero-images`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ imageUrl }),
  });
  if (!res.ok) throw await toError(res);
  return res.json();
}

export async function adminSetHeroImagePosition(id: number, position: number): Promise<void> {
  const res = await fetch(`/api/admin/hero-images/${id}`, {
    method: "PATCH",
    headers: authHeaders(),
    body: JSON.stringify({ position }),
  });
  if (!res.ok) throw new Error(`Error ${res.status}`);
}

export async function adminDeleteHeroImage(id: number): Promise<void> {
  const res = await fetch(`/api/admin/hero-images/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error(`Error ${res.status}`);
}

/** Sube una foto para el carrusel de la portada y devuelve la URL. */
export async function adminUploadHeroImage(file: File): Promise<string> {
  const fd = new FormData();
  fd.append("file", file);
  const res = await fetch(`/api/admin/hero-images/upload`, {
    method: "POST",
    headers: { Authorization: `Bearer ${getToken() ?? ""}` },
    body: fd,
  });
  if (!res.ok) throw await toError(res);
  const data = (await res.json()) as { url: string };
  return data.url;
}

// ---- Reseñas de producto ----
export type AdminReview = {
  id: number;
  productId: number;
  productName: string;
  name: string;
  rating: number;
  comment: string;
  published: boolean;
  createdAt: string;
};

export async function adminListReviews(): Promise<AdminReview[]> {
  const res = await fetch(`/api/admin/reviews`, { headers: authHeaders(), cache: "no-store" });
  if (!res.ok) throw new Error(`Error ${res.status}`);
  return res.json();
}

export async function adminSetReviewPublished(id: number, published: boolean): Promise<void> {
  const res = await fetch(`/api/admin/reviews/${id}`, {
    method: "PATCH",
    headers: authHeaders(),
    body: JSON.stringify({ published }),
  });
  if (!res.ok) throw new Error(`Error ${res.status}`);
}

export async function adminDeleteReview(id: number): Promise<void> {
  const res = await fetch(`/api/admin/reviews/${id}`, { method: "DELETE", headers: authHeaders() });
  if (!res.ok) throw new Error(`Error ${res.status}`);
}

// ---- Newsletter ----
export type AdminSubscriber = { id: number; email: string; createdAt: string };

export async function adminListSubscribers(): Promise<AdminSubscriber[]> {
  const res = await fetch(`/api/admin/subscribers`, { headers: authHeaders(), cache: "no-store" });
  if (!res.ok) throw new Error(`Error ${res.status}`);
  return res.json();
}

// ---- Envío ----
export async function adminGetShipping(): Promise<ShippingSettings> {
  const res = await fetch(`/api/admin/shipping`, { headers: authHeaders(), cache: "no-store" });
  if (!res.ok) throw new Error(`Error ${res.status}`);
  return res.json();
}

export async function adminSetShipping(settings: ShippingSettings): Promise<void> {
  const res = await fetch(`/api/admin/shipping`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify(settings),
  });
  if (!res.ok) throw await toError(res);
}

// ---- Avisos de stock ----
export async function adminListStockNotifications(): Promise<{ productId: number; count: number }[]> {
  const res = await fetch(`/api/admin/stock-notifications`, { headers: authHeaders(), cache: "no-store" });
  if (!res.ok) throw new Error(`Error ${res.status}`);
  return res.json();
}

// ---- Preguntas de producto ----
export type AdminQuestion = {
  id: number;
  productId: number;
  productName: string;
  name: string;
  question: string;
  answer: string | null;
  createdAt: string;
};

export async function adminListQuestions(): Promise<AdminQuestion[]> {
  const res = await fetch(`/api/admin/questions`, { headers: authHeaders(), cache: "no-store" });
  if (!res.ok) throw new Error(`Error ${res.status}`);
  return res.json();
}

export async function adminAnswerQuestion(id: number, answer: string | null): Promise<void> {
  const res = await fetch(`/api/admin/questions/${id}`, {
    method: "PATCH",
    headers: authHeaders(),
    body: JSON.stringify({ answer }),
  });
  if (!res.ok) throw new Error(`Error ${res.status}`);
}

export async function adminDeleteQuestion(id: number): Promise<void> {
  const res = await fetch(`/api/admin/questions/${id}`, { method: "DELETE", headers: authHeaders() });
  if (!res.ok) throw new Error(`Error ${res.status}`);
}

async function toError(res: Response): Promise<Error> {
  try {
    const data = await res.json();
    if (data?.errors) {
      const msgs = Object.values(data.errors as Record<string, string[]>)
        .flat()
        .join(" ");
      return new Error(msgs || `Error ${res.status}`);
    }
  } catch {
    /* sin cuerpo JSON */
  }
  return new Error(`Error ${res.status}`);
}
