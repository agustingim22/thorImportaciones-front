import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/api", "/cuenta", "/carrito", "/pedido", "/favoritos"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
