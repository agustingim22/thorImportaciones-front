import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com" },
      // Fotos de productos y parches importados del proveedor (gmkitsd.com),
      // enlazadas directamente en vez de resubidas a Cloudinary.
      { protocol: "https", hostname: "ssl.images-ssl-mars.com" },
    ],
  },
  async headers() {
    return [
      {
        // Encabezados de seguridad básicos en todas las páginas. (HSTS ya lo manda Vercel.)
        // No se agrega Content-Security-Policy a propósito: con Google Tag Manager, Meta Pixel, Instagram y
        // Mercado Pago una política mal armada rompería el sitio; conviene sumarla aparte y probándola.
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" }, // el navegador no "adivina" el tipo de un archivo
          { key: "X-Frame-Options", value: "SAMEORIGIN" }, // nadie puede mostrar el sitio dentro de otra página (clickjacking)
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" }, // no filtra direcciones completas a otros sitios
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" }, // el sitio no usa estas funciones
        ],
      },
    ];
  },
  async rewrites() {
    return [
      {
        // Direcciones lindas para las páginas de equipo: /equipo/real-madrid se sirve con /catalogo?club=real-madrid.
        // Los demás filtros (?type=, ?page=, ?q=…) se mantienen. La dirección vieja (?club=) sigue
        // funcionando y su canonical apunta a la nueva.
        source: "/equipo/:slug",
        destination: "/catalogo?club=:slug",
      },
    ];
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
