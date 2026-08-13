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
  stock: number; // unidades disponibles
  inStock: boolean; // = stock > 0, para no tocar la UI que ya lo usa
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

/** A partir de cuántas unidades o menos mostramos el aviso de "últimas unidades". */
export const LOW_STOCK_THRESHOLD = 3;

/** Cuántos días desde que se creó un producto lo consideramos "Nuevo" en el catálogo. */
export const NEW_PRODUCT_DAYS = 14;

export function isNewProduct(createdAt: string): boolean {
  const ageMs = Date.now() - new Date(createdAt).getTime();
  return ageMs <= NEW_PRODUCT_DAYS * 24 * 60 * 60 * 1000;
}
