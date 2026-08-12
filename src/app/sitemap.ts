import type { MetadataRoute } from "next";
import { getProducts } from "@/lib/products";
import { SITE_URL } from "@/lib/site";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, changeFrequency: "daily", priority: 1 },
    { url: `${SITE_URL}/camisetas`, changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE_URL}/pedido-personalizado`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${SITE_URL}/talles`, changeFrequency: "monthly", priority: 0.4 },
    { url: `${SITE_URL}/preguntas-frecuentes`, changeFrequency: "monthly", priority: 0.4 },
    { url: `${SITE_URL}/contacto`, changeFrequency: "yearly", priority: 0.3 },
  ];

  let products: MetadataRoute.Sitemap = [];
  try {
    const rows = await getProducts();
    products = rows.map((p) => ({
      url: `${SITE_URL}/producto/${p.slug}`,
      lastModified: p.createdAt,
      changeFrequency: "weekly",
      priority: 0.8,
    }));
  } catch {
    products = [];
  }

  return [...staticRoutes, ...products];
}
