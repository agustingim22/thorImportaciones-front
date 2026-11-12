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
  team: string; // nombre original (del proveedor o cargado a mano); es el que usa el admin
  name: string; // nombre para el cliente en la tienda (ver lib/displayName)
  club: string | null; // slug del equipo destacado (ver lib/clubs)
  clubManual: boolean; // true si el admin lo eligió a mano (la clasificación automática no lo toca)
  type: ProductType;
  price: number; // precio de lista
  salePrice: number | null; // si está seteado y es menor a price, es el precio de oferta
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
  isBestSeller: boolean; // entre los más pedidos históricamente (ver getBestSellerIds)
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

/** Lo mínimo que necesita una tarjeta del listado. Es lo único que viaja al navegador por cada producto de la
 *  grilla: lo demás (descripción, fotos, talles, stock por talle, parches) se pide recién al abrir la vista
 *  rápida, así cada página de 24 productos pesa bastante menos. */
export type CardProduct = Pick<
  Product,
  | "id"
  | "slug"
  | "name"
  | "type"
  | "price"
  | "salePrice"
  | "colorCss"
  | "imageUrl"
  | "stock"
  | "inStock"
  | "presetName"
  | "presetNumber"
  | "createdAt"
  | "isBestSeller"
> & { hasPatches: boolean };

export function toCardProduct(p: Product): CardProduct {
  return {
    id: p.id,
    slug: p.slug,
    name: p.name,
    type: p.type,
    price: p.price,
    salePrice: p.salePrice,
    colorCss: p.colorCss,
    imageUrl: p.imageUrl,
    stock: p.stock,
    inStock: p.inStock,
    presetName: p.presetName,
    presetNumber: p.presetNumber,
    createdAt: p.createdAt,
    isBestSeller: p.isBestSeller,
    hasPatches: p.patches.length > 0,
  };
}

/** Todos los talles posibles del catálogo. S a XXL siempre están; XXXL/XXXXL son opcionales por producto. */
export const ALL_SIZES = ["S", "M", "L", "XL", "XXL", "XXXL", "XXXXL"] as const;
export const DEFAULT_SIZES = ["S", "M", "L", "XL", "XXL"];

/** Precio que realmente se cobra: la oferta si hay una válida (menor al de lista), si no el de lista. */
export function effectivePrice(p: Pick<Product, "price" | "salePrice">): number {
  return p.salePrice != null && p.salePrice < p.price ? p.salePrice : p.price;
}

/** A partir de cuántas unidades o menos mostramos el aviso de "últimas unidades". */
export const LOW_STOCK_THRESHOLD = 3;

/** Cuántos días desde que se creó un producto lo consideramos "Nuevo" en el catálogo. */
export const NEW_PRODUCT_DAYS = 14;

export function isNewProduct(createdAt: string): boolean {
  const ageMs = Date.now() - new Date(createdAt).getTime();
  return ageMs <= NEW_PRODUCT_DAYS * 24 * 60 * 60 * 1000;
}
