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
  colorCss: string;
  images: string[]; // hasta 3 fotos
  description: string;
  stock: number; // unidades disponibles
  presetName: string | null; // si está, el comprador no elige nombre
  presetNumber: string | null; // si está, el comprador no elige número
  patches: PatchInput[]; // opciones de parche (vacío = sin opciones)
  sizes: string[]; // talles disponibles
  slug?: string | null;
};

export function validateProduct(input: ProductInput): Record<string, string[]> | null {
  const e: Record<string, string[]> = {};
  if (!input?.team?.trim()) e.team = ["El nombre de la camiseta es obligatorio."];
  if (!PRODUCT_TYPES.includes(input?.type)) e.type = ["Elegí un tipo de producto válido."];
  if (typeof input?.price !== "number" || input.price < 0) e.price = ["El precio no puede ser negativo."];
  if (!Array.isArray(input?.images) || input.images.length > 3)
    e.images = ["Podés subir hasta 3 fotos."];
  if (typeof input?.stock !== "number" || !Number.isInteger(input.stock) || input.stock < 0)
    e.stock = ["El stock debe ser un número entero, 0 o mayor."];
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
  return Object.keys(e).length ? e : null;
}

/** Datos escalares listos para Prisma (create/update). Los parches se manejan aparte. */
export function toProductData(input: ProductInput, slug: string): Prisma.ProductUncheckedCreateInput {
  const customizable = typeAllowsCustomization(input.type);
  return {
    slug,
    team: input.team.trim(),
    type: input.type,
    price: input.price,
    colorCss: input.colorCss?.trim() || "linear-gradient(160deg,#FFC44D,#DE9A26)",
    images: (input.images ?? []).slice(0, 3).map((u) => u.trim()).filter(Boolean),
    description: (input.description ?? "").trim(),
    stock: input.stock,
    // Nombre/número solo tienen sentido en camisetas; en el resto se ignoran aunque lleguen.
    presetName: customizable ? input.presetName?.trim() || null : null,
    presetNumber: customizable ? input.presetNumber?.trim() || null : null,
    sizes: input.sizes,
  };
}
