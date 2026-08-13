/**
 * Tipos compartidos (seguros para usar en cliente y servidor).
 * Los datos se obtienen con Prisma en Server Components (ver lib/products.ts)
 * y con route handlers (/api/...) desde componentes de cliente.
 */
export type ProductType =
  | "retro"
  | "fan"
  | "player"
  | "nba"
  | "rugby"
  | "remera"
  | "conjunto"
  | "pantalon";

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
  sizes: string[]; // talles disponibles para esta camiseta
  sizeStock: Record<string, number>; // unidades disponibles por talle (talle -> stock)
  createdAt: string;
};

export const PRODUCT_TYPE_LABELS: Record<ProductType, string> = {
  retro: "Retro",
  fan: "Versión Fan",
  player: "Versión Jugador",
  nba: "NBA",
  rugby: "Rugby",
  remera: "Remera",
  conjunto: "Conjunto deportivo",
  pantalon: "Pantalón / Short",
};

/** Todos los tipos válidos (única fuente de verdad, usada para validar en el servidor). */
export const PRODUCT_TYPES = Object.keys(PRODUCT_TYPE_LABELS) as ProductType[];

/**
 * Camisetas: se compran con nombre, número y parche a elección.
 * El resto (remeras, conjuntos, pantalones) se compra solo por talle.
 */
export const CUSTOMIZABLE_PRODUCT_TYPES: ProductType[] = ["retro", "fan", "player", "nba", "rugby"];

export function typeAllowsCustomization(type: ProductType): boolean {
  return CUSTOMIZABLE_PRODUCT_TYPES.includes(type);
}

/** A qué pestaña de /talles corresponde cada tipo de producto (ver TallesGuide). */
export const PRODUCT_TYPE_TALLES_CATEGORY: Record<ProductType, string> = {
  retro: "futbol",
  fan: "futbol",
  player: "futbol",
  nba: "otros-deportes",
  rugby: "otros-deportes",
  remera: "remeras",
  conjunto: "remeras",
  pantalon: "pantalones",
};

/** Todos los talles posibles del catálogo. S a XXL siempre están; XXXL/XXXXL son opcionales por producto. */
export const ALL_SIZES = ["S", "M", "L", "XL", "XXL", "XXXL", "XXXXL"] as const;
export const DEFAULT_SIZES = ["S", "M", "L", "XL", "XXL"];

/** A partir de cuántas unidades o menos mostramos el aviso de "últimas unidades". */
export const LOW_STOCK_THRESHOLD = 3;

/** Cuántos días desde que se creó un producto lo consideramos "Nuevo" en el catálogo. */
export const NEW_PRODUCT_DAYS = 14;

export function isNewProduct(createdAt: string): boolean {
  const ageMs = Date.now() - new Date(createdAt).getTime();
  return ageMs <= NEW_PRODUCT_DAYS * 24 * 60 * 60 * 1000;
}
