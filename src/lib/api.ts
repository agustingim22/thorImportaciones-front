/**
 * Tipos compartidos (seguros para usar en cliente y servidor).
 * Los datos se obtienen con Prisma en Server Components (ver lib/products.ts)
 * y con route handlers (/api/...) desde componentes de cliente.
 */
export type ProductType = "retro" | "fan" | "player";

export type Patch = {
  id: number;
  label: string;
  imageUrl: string;
  extraPrice: number;
};

export type Product = {
  id: number;
  slug: string;
  team: string;
  type: ProductType;
  price: number;
  colorCss: string;
  images: string[]; // hasta 3 fotos; images[0] es la portada
  imageUrl: string | null; // = images[0] ?? null, para las cards/carrito
  description: string;
  inStock: boolean;
  presetName: string | null; // si está, el comprador no elige nombre
  presetNumber: string | null; // si está, el comprador no elige número
  patches: Patch[]; // opciones de parche disponibles (vacío = sin parche)
  createdAt: string;
};

export const PRODUCT_TYPE_LABELS: Record<ProductType, string> = {
  retro: "Retro",
  fan: "Versión Fan",
  player: "Versión Jugador",
};
