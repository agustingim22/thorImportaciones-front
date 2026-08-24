import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [{ protocol: "https", hostname: "res.cloudinary.com" }],
  },
  async redirects() {
    return [
      {
        // La vista se renombró de /camisetas a /catalogo — se mantiene el link viejo
        // (compartido, indexado en Google, guardado en favoritos del navegador, etc.)
        source: "/camisetas",
        destination: "/catalogo",
        permanent: true,
      },
    ];
  },
};

export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  // Sin SENTRY_AUTH_TOKEN (todavía no configurado en Vercel), esto solo
  // se salta la subida de source maps con un aviso — no rompe el build.
  silent: true,
});
