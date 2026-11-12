import type { MetadataRoute } from "next";
import { getClubCounts, getSitemapProducts } from "@/lib/products";
import { FEATURED_CLUBS } from "@/lib/clubs";
import { SITE_URL } from "@/lib/site";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, changeFrequency: "daily", priority: 1 },
    { url: `${SITE_URL}/catalogo`, changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE_URL}/equipos`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${SITE_URL}/pedido-personalizado`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${SITE_URL}/talles`, changeFrequency: "monthly", priority: 0.4 },
    { url: `${SITE_URL}/preguntas-frecuentes`, changeFrequency: "monthly", priority: 0.4 },
    { url: `${SITE_URL}/sobre-nosotros`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${SITE_URL}/contacto`, changeFrequency: "yearly", priority: 0.3 },
  ];

  let products: MetadataRoute.Sitemap = [];
  try {
    const rows = await getSitemapProducts();
    products = rows.map((p) => ({
      url: `${SITE_URL}/producto/${p.slug}`,
      lastModified: p.createdAt,
      changeFrequency: "weekly",
      priority: 0.8,
    }));
  } catch {
    products = [];
  }

  // Una página por equipo con productos (/catalogo?club=…): son las búsquedas más valiosas para Google.
  let teams: MetadataRoute.Sitemap = [];
  try {
    const counts = await getClubCounts();
    teams = FEATURED_CLUBS.filter((c) => (counts[c.slug] ?? 0) > 0).map((c) => ({
      url: `${SITE_URL}/catalogo?club=${c.slug}`,
      changeFrequency: "weekly",
      priority: 0.7,
    }));
  } catch {
    teams = [];
  }

  return [...staticRoutes, ...teams, ...products];
}
