/**
 * Cliente de la API de Thor (backend C# .NET).
 * La URL base se configura con NEXT_PUBLIC_API_URL (ver .env.local).
 */
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5184";

export type Product = {
  id: number;
  slug: string;
  team: string;
  type: "retro" | "player";
  number: number;
  price: number;
  fabric: string;
  colorCss: string;
  imageUrl: string | null;
  description: string;
  inStock: boolean;
  createdAt: string;
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

export async function getProducts(
  params: { type?: "retro" | "player"; q?: string } = {},
): Promise<Product[]> {
  const url = new URL(`${API_BASE_URL}/api/products`);
  if (params.type) url.searchParams.set("type", params.type);
  if (params.q) url.searchParams.set("q", params.q);
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`API respondió ${res.status}`);
  return res.json();
}
