/**
 * Cliente de la API de Thor (backend C# .NET).
 * La URL base se configura con NEXT_PUBLIC_API_URL (ver .env.local).
 */
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5184";

export type Product = {
  id: string;
  slug: string;
  team: string;
  type: "retro" | "player";
  number: number;
  price: number;
  fabric: string;
  colorCss: string;
  description: string;
  inStock: boolean;
};

export type Health = {
  status: string;
  service: string;
  timestamp: string;
};

export async function getHealth(): Promise<Health> {
  const res = await fetch(`${API_BASE_URL}/health`, { cache: "no-store" });
  if (!res.ok) throw new Error(`API respondió ${res.status}`);
  return res.json();
}

export async function getProducts(type?: "retro" | "player"): Promise<Product[]> {
  const url = new URL(`${API_BASE_URL}/api/products`);
  if (type) url.searchParams.set("type", type);
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`API respondió ${res.status}`);
  return res.json();
}
