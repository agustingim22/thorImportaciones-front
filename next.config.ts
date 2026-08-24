import type { NextConfig } from "next";

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

export default nextConfig;
