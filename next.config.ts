import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

/**
 * Política de seguridad de contenido (CSP). Qué se aplica y qué solo se mide:
 *  - OBLIGATORIA: object-src y base-uri. El sitio no usa <object>, <embed> ni <base>, así que no puede romperse nada.
 *  - SOLO REPORTE: el resto (de dónde puede bajar scripts, imágenes, etc.). El navegador avisa a /api/csp-report qué
 *    habría bloqueado pero no bloquea nada; con esos avisos se ajusta la lista y, si algún día se quiere, se pasa a
 *    obligatoria. Lleva 'unsafe-inline' en scripts porque Next inserta scripts en línea y un "nonce" obligaría a
 *    renderizar todas las páginas en cada visita (se perdería el caché): protege menos contra XSS que una política estricta.
 *  Solo en producción: en desarrollo Next usa eval y llenaría los avisos de ruido.
 */
const CSP_ENFORCED = "object-src 'none'; base-uri 'self'";
const CSP_REPORT_ONLY = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://connect.facebook.net https://www.instagram.com https://www.google-analytics.com",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://res.cloudinary.com https://ssl.images-ssl-mars.com https://www.facebook.com https://www.google-analytics.com https://www.googletagmanager.com https://*.cdninstagram.com https://*.fbcdn.net https://www.google.com https://googleads.g.doubleclick.net",
  "font-src 'self' data:",
  "connect-src 'self' https://www.google-analytics.com https://*.google-analytics.com https://*.analytics.google.com https://www.googletagmanager.com https://www.facebook.com https://connect.facebook.net https://*.ingest.sentry.io https://*.ingest.us.sentry.io",
  "frame-src https://www.googletagmanager.com https://www.instagram.com",
  "form-action 'self'",
  "frame-ancestors 'self'",
  "report-uri /api/csp-report",
].join("; ");

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
          ...(process.env.NODE_ENV === "production"
            ? [
                { key: "Content-Security-Policy", value: CSP_ENFORCED },
                { key: "Content-Security-Policy-Report-Only", value: CSP_REPORT_ONLY },
              ]
            : []),
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
