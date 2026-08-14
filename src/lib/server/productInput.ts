import "server-only";
import { Prisma } from "@prisma/client";
import { PRODUCT_TYPES, typeAllowsCustomization, type ProductType } from "@/lib/api";

const VALID_SIZES = ["S", "M", "L", "XL", "XXL", "XXXL", "XXXXL"] as const;

export type PatchInput = {
  label: string;
  imageUrl: string;
  extraPrice: number;
};

export type ProductInput = {
  team: string;
  type: ProductType;
  price: number;
  salePrice: number | null; // precio de oferta, opcional (debe ser menor a price)
  colorCss: string;
  images: string[]; // hasta 3 fotos
  description: string;
  presetName: string | null; // si está, el comprador no elige nombre
  presetNumber: string | null; // si está, el comprador no elige número
  patches: PatchInput[]; // opciones de parche (vacío = sin opciones)
  sizes: string[]; // talles disponibles
  sizeStock: Record<string, number>; // unidades disponibles por talle
  slug?: string | null;
};

export function validateProduct(input: ProductInput): Record<string, string[]> | null {
  const e: Record<string, string[]> = {};
  if (!input?.team?.trim()) e.team = ["El nombre de la camiseta es obligatorio."];
  if (!PRODUCT_TYPES.includes(input?.type)) e.type = ["Elegí un tipo de producto válido."];
  if (typeof input?.price !== "number" || input.price < 0) e.price = ["El precio no puede ser negativo."];
  if (input?.salePrice != null) {
    if (typeof input.salePrice !== "number" || input.salePrice < 0) {
      e.salePrice = ["El precio de oferta no puede ser negativo."];
    } else if (typeof input.price === "number" && input.salePrice >= input.price) {
      e.salePrice = ["El precio de oferta tiene que ser menor al precio de lista."];
    }
  }
  if (!Array.isArray(input?.images) || input.images.length > 3)
    e.images = ["Podés subir hasta 3 fotos."];
  if (input?.presetNumber) {
    const n = Number(input.presetNumber);
    if (!Number.isInteger(n) || n < 0 || n > 99) e.presetNumber = ["El número debe estar entre 0 y 99."];
  }
  if (Array.isArray(input?.patches)) {
    const badPatch = input.patches.some((p) => !p.label?.trim() || !p.imageUrl?.trim());
    if (badPatch) e.patches = ["Cada parche necesita una foto y un nombre."];
    if (input.patches.some((p) => typeof p.extraPrice !== "number" || p.extraPrice < 0))
      e.patches = ["El precio extra del parche no puede ser negativo."];
  }
  if (
    !Array.isArray(input?.sizes) ||
    input.sizes.length === 0 ||
    input.sizes.some((s) => !VALID_SIZES.includes(s as (typeof VALID_SIZES)[number]))
  ) {
    e.sizes = ["Elegí al menos un talle disponible."];
  }
  const stockEntries = Object.entries(input?.sizeStock ?? {});
  const badStock = stockEntries.some(
    ([, qty]) => typeof qty !== "number" || !Number.isInteger(qty) || qty < 0,
  );
  if (badStock) e.sizeStock = ["El stock de cada talle debe ser un número entero, 0 o mayor."];
  return Object.keys(e).length ? e : null;
}

/** Datos escalares listos para Prisma (create/update). Parches y stock por talle se manejan aparte. */
export function toProductData(input: ProductInput, slug: string): Prisma.ProductUncheckedCreateInput {
  const customizable = typeAllowsCustomization(input.type);
  const totalStock = input.sizes.reduce((sum, s) => sum + (input.sizeStock?.[s] ?? 0), 0);
  return {
    slug,
    team: input.team.trim(),
    type: input.type,
    price: input.price,
    salePrice: input.salePrice != null && input.salePrice < input.price ? input.salePrice : null,
    colorCss: input.colorCss?.trim() || "linear-gradient(160deg,#FFC44D,#DE9A26)",
    images: (input.images ?? []).slice(0, 3).map((u) => u.trim()).filter(Boolean),
    description: (input.description ?? "").trim(),
    stock: totalStock,
    // Nombre/número solo tienen sentido en camisetas; en el resto se ignoran aunque lleguen.
    presetName: customizable ? input.presetName?.trim() || null : null,
    presetNumber: customizable ? input.presetNumber?.trim() || null : null,
    sizes: input.sizes,
  };
}

/** Filas de ProductSize (stock por talle) listas para crear, en base a `sizes` + `sizeStock`. */
export function toSizeStockRows(input: ProductInput): { size: string; stock: number }[] {
  return input.sizes.map((size) => ({ size, stock: Math.max(0, input.sizeStock?.[size] ?? 0) }));
}
