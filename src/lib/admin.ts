"use client";

import { API_BASE_URL, type Product } from "./api";

const TOKEN_KEY = "thor-admin-token";

export type ProductInput = {
  team: string;
  type: "retro" | "player";
  number: number;
  price: number;
  fabric: string;
  colorCss: string;
  imageUrl: string | null;
  description: string;
  inStock: boolean;
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
  const res = await fetch(`${API_BASE_URL}/api/admin/ping`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.ok;
}

export async function adminListProducts(): Promise<Product[]> {
  const res = await fetch(`${API_BASE_URL}/api/admin/products`, {
    headers: authHeaders(),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Error ${res.status}`);
  return res.json();
}

/** Devuelve el producto creado, o lanza con los mensajes de validación. */
export async function adminCreateProduct(input: ProductInput): Promise<Product> {
  const res = await fetch(`${API_BASE_URL}/api/admin/products`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(input),
  });
  if (!res.ok) throw await toError(res);
  return res.json();
}

export async function adminUpdateProduct(id: number, input: ProductInput): Promise<Product> {
  const res = await fetch(`${API_BASE_URL}/api/admin/products/${id}`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify(input),
  });
  if (!res.ok) throw await toError(res);
  return res.json();
}

export async function adminDeleteProduct(id: number): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/api/admin/products/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
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
