"use client";

import type { Product, ProductType } from "./api";
import type { ShippingSettings } from "./shippingCalc";
import type { BundleSettings } from "./bundle";
import type { PriceChangeSummary, PriceExpectation, PricePreview, PriceUpdateParams } from "./priceUpdate";

// Antes el token de admin se guardaba acá, en localStorage (cualquier script de la página podía leerlo). Ahora
// el servidor da una cookie de sesión httpOnly; esta clave solo se usa para migrar a quien lo tenía guardado.
const LEGACY_TOKEN_KEY = "thor-admin-token";

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
  /** "" o ausente = equipo automático; "none" = sin equipo; o el slug de un equipo (fijado a mano). */
  club?: string | null;
};

/** El token que tenía guardado el navegador de versiones anteriores del panel, si lo hay. */
export function getLegacyToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(LEGACY_TOKEN_KEY);
  } catch {
    return null;
  }
}
export function clearLegacyToken() {
  try {
    window.localStorage.removeItem(LEGACY_TOKEN_KEY);
  } catch {
    /* sin acceso al almacenamiento: nada que borrar */
  }
}

// La sesión viaja en una cookie httpOnly que el navegador manda solo a /api/admin: acá no hay nada que armar.
function authHeaders(): HeadersInit {
  return { "Content-Type": "application/json" };
}

/** Ingresa con el token de administrador; si es correcto el servidor deja la cookie de sesión. */
export async function adminLogin(token: string): Promise<{ ok: boolean; weakToken: boolean; error?: string }> {
  const res = await fetch(`/api/admin/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token }),
  });
  if (res.ok) {
    const data = (await res.json()) as { weakToken?: boolean };
    return { ok: true, weakToken: !!data.weakToken };
  }
  const data = (await res.json().catch(() => ({}))) as { error?: string };
  return { ok: false, weakToken: false, error: data.error };
}

/** ¿Hay una sesión de administrador vigente? `weakToken`: el ADMIN_TOKEN configurado es corto. */
export async function adminSession(): Promise<{ ok: boolean; weakToken: boolean }> {
  try {
    const res = await fetch(`/api/admin/ping`, { cache: "no-store" });
    if (!res.ok) return { ok: false, weakToken: false };
    const data = (await res.json()) as { weakToken?: boolean };
    return { ok: true, weakToken: !!data.weakToken };
  } catch {
    return { ok: false, weakToken: false };
  }
}

export async function adminLogout(): Promise<void> {
  await fetch(`/api/admin/logout`, { method: "POST" }).catch(() => {});
}

export type AdminProductsFilters = { q?: string; type?: string };

function productsQuery(f: AdminProductsFilters, extra: Record<string, string | number> = {}): string {
  const p = new URLSearchParams();
  if (f.q) p.set("q", f.q);
  if (f.type) p.set("type", f.type);
  for (const [k, v] of Object.entries(extra)) p.set(k, String(v));
  const s = p.toString();
  return s ? `?${s}` : "";
}

/** TODOS los productos que coinciden con el filtro (pesa varios MB con el catálogo entero: se usa para exportar). */
export async function adminListProducts(filters: AdminProductsFilters = {}): Promise<Product[]> {
  const res = await fetch(`/api/admin/products${productsQuery(filters)}`, {
    headers: authHeaders(),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Error ${res.status}`);
  return res.json();
}

export type AdminProductsPage = { items: Product[]; total: number; page: number; pageSize: number; pages: number };

/** Una página del listado, con búsqueda y filtro de tipo resueltos en el servidor. */
export async function adminProductsPage(
  params: AdminProductsFilters & { page: number; pageSize?: number },
): Promise<AdminProductsPage> {
  const { page, pageSize = 50, ...filters } = params;
  const res = await fetch(`/api/admin/products${productsQuery(filters, { page, pageSize })}`, {
    headers: authHeaders(),
    cache: "no-store",
  });
  if (!res.ok) throw await toError(res);
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

// ---- Cupones de descuento ----
export type AdminCoupon = {
  id: number;
  code: string;
  type: "percentage" | "fixed";
  value: number;
  active: boolean;
  expiresAt: string | null;
  maxUses: number | null;
  usedCount: number;
  minOrderValue: number | null;
  createdAt: string;
};
export type CouponInput = {
  code: string;
  type: "percentage" | "fixed";
  value: number;
  active: boolean;
  expiresAt: string | null;
  maxUses: number | null;
  minOrderValue: number | null;
};

export async function adminListCoupons(): Promise<AdminCoupon[]> {
  const res = await fetch(`/api/admin/coupons`, { headers: authHeaders(), cache: "no-store" });
  if (!res.ok) throw new Error(`Error ${res.status}`);
  return res.json();
}

export async function adminCreateCoupon(input: CouponInput): Promise<AdminCoupon> {
  const res = await fetch(`/api/admin/coupons`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(input),
  });
  if (!res.ok) throw await toError(res);
  return res.json();
}

export async function adminUpdateCoupon(id: number, input: CouponInput): Promise<AdminCoupon> {
  const res = await fetch(`/api/admin/coupons/${id}`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify(input),
  });
  if (!res.ok) throw await toError(res);
  return res.json();
}

export async function adminDeleteCoupon(id: number): Promise<void> {
  const res = await fetch(`/api/admin/coupons/${id}`, { method: "DELETE", headers: authHeaders() });
  if (!res.ok) throw new Error(`Error ${res.status}`);
}

// ---- Pop-up de newsletter con cupón ----
export type NewsletterPopupSettings = {
  enabled: boolean;
  couponCode: string | null;
  headline: string;
  subtext: string;
};

export async function adminGetNewsletterPopup(): Promise<NewsletterPopupSettings> {
  const res = await fetch(`/api/admin/newsletter-popup`, { headers: authHeaders(), cache: "no-store" });
  if (!res.ok) throw new Error(`Error ${res.status}`);
  return res.json();
}

export async function adminUpdateNewsletterPopup(
  input: NewsletterPopupSettings,
): Promise<NewsletterPopupSettings> {
  const res = await fetch(`/api/admin/newsletter-popup`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify(input),
  });
  if (!res.ok) throw await toError(res);
  return res.json();
}

// ---- Clasificación por equipo (filtro de clubes y selecciones del catálogo) ----
export type ClubClassifySummary = {
  dryRun: boolean;
  total: number;
  matched: number; // productos que tienen (o tendrían) un equipo
  unmatched: number; // sin equipo destacado (otros equipos, NBA, rugby, etc.)
  pendingChanges: number; // productos que cambiarían al aplicar
  manual: number; // con equipo elegido a mano: la clasificación nunca los toca
  byClub: Record<string, number>; // slug del equipo → cantidad de productos
  unmatchedSample: string[]; // muestra de nombres que quedaron sin equipo
  /** Los equipos que más se repiten entre los que quedaron sin equipo (los que conviene sumar primero). */
  unmatchedTop: { name: string; count: number; example: string }[];
  updated?: number; // solo al aplicar
};

/** apply=false: simulacro, no toca nada. apply=true: aplica la clasificación. */
export async function adminClassifyClubs(apply: boolean): Promise<ClubClassifySummary> {
  const res = await fetch(`/api/admin/clubs/classify`, {
    method: apply ? "POST" : "GET",
    headers: authHeaders(),
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(res.status === 401 ? "Sesión vencida: volvé a ingresar." : `Error ${res.status}`);
  }
  return res.json();
}

// ---- Posts de Instagram (prueba social en la home) ----
export type AdminInstagramPost = { id: number; url: string; createdAt: string };

export async function adminListInstagramPosts(): Promise<AdminInstagramPost[]> {
  const res = await fetch(`/api/admin/instagram-posts`, { headers: authHeaders(), cache: "no-store" });
  if (!res.ok) throw new Error(`Error ${res.status}`);
  return res.json();
}

export async function adminCreateInstagramPost(url: string): Promise<AdminInstagramPost> {
  const res = await fetch(`/api/admin/instagram-posts`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ url }),
  });
  if (!res.ok) throw await toError(res);
  return res.json();
}

export async function adminDeleteInstagramPost(id: number): Promise<void> {
  const res = await fetch(`/api/admin/instagram-posts/${id}`, { method: "DELETE", headers: authHeaders() });
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

// ---- Actualización de precios por porcentaje ----
export type AdminPriceHistory = { history: PriceChangeSummary[]; undoableId: number | null };

export async function adminPriceHistory(): Promise<AdminPriceHistory> {
  const res = await fetch(`/api/admin/prices`, { headers: authHeaders(), cache: "no-store" });
  if (!res.ok) throw await toError(res);
  return res.json();
}

/** Calcula qué cambiaría con estos datos, sin tocar ningún precio. */
export async function adminPricePreview(params: PriceUpdateParams): Promise<PricePreview> {
  const res = await fetch(`/api/admin/prices`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ ...params, mode: "preview" }),
  });
  if (!res.ok) throw await toError(res);
  return res.json();
}

/** Aplica el cambio que se vio en la vista previa (`expect`); el servidor verifica que nada haya cambiado. */
export async function adminPriceApply(
  params: PriceUpdateParams,
  expect: PriceExpectation,
): Promise<{ count: number; id: number } & AdminPriceHistory> {
  const res = await fetch(`/api/admin/prices`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ ...params, mode: "apply", expect }),
  });
  if (!res.ok) throw await toError(res);
  return res.json();
}

export async function adminPriceUndo(): Promise<{ reverted: number; skipped: number } & AdminPriceHistory> {
  const res = await fetch(`/api/admin/prices/undo`, { method: "POST", headers: authHeaders() });
  if (!res.ok) throw await toError(res);
  return res.json();
}

// ---- Combo (descuento por cantidad) ----
export async function adminGetBundle(): Promise<BundleSettings> {
  const res = await fetch(`/api/admin/bundle`, { headers: authHeaders(), cache: "no-store" });
  if (!res.ok) throw await toError(res);
  return res.json();
}

export async function adminSetBundle(settings: BundleSettings): Promise<BundleSettings> {
  const res = await fetch(`/api/admin/bundle`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify(settings),
  });
  if (!res.ok) throw await toError(res);
  return res.json();
}

// ---- Búsquedas de los clientes ----
export type AdminSearchTerm = { id: number; term: string; searches: number; results: number; lastAt: string };
export type AdminSearches = {
  zero: AdminSearchTerm[]; // lo que buscaron y no encontraron
  top: AdminSearchTerm[]; // lo más buscado con resultados
  totalSearches: number;
  distinctTerms: number;
};

export async function adminGetSearches(): Promise<AdminSearches> {
  const res = await fetch(`/api/admin/searches`, { headers: authHeaders(), cache: "no-store" });
  if (!res.ok) throw await toError(res);
  return res.json();
}

export async function adminDeleteSearch(id: number): Promise<void> {
  const res = await fetch(`/api/admin/searches?id=${id}`, { method: "DELETE", headers: authHeaders() });
  if (!res.ok) throw await toError(res);
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
    if (typeof data?.error === "string" && data.error) {
      return new Error(data.error);
    }
  } catch {
    /* sin cuerpo JSON */
  }
  return new Error(`Error ${res.status}`);
}
