import "server-only";
import { Prisma } from "@prisma/client";

export type ProductInput = {
  team: string;
  type: "retro" | "player";
  number: number;
  price: number;
  fabric: string;
  colorCss: string;
  imageUrl: string | null;
  description: string;
  inStock: boolean;
  slug?: string | null;
};

export function validateProduct(input: ProductInput): Record<string, string[]> | null {
  const e: Record<string, string[]> = {};
  if (!input?.team?.trim()) e.team = ["El nombre de la camiseta es obligatorio."];
  if (input?.type !== "retro" && input?.type !== "player") e.type = ["El tipo debe ser 'retro' o 'player'."];
  if (typeof input?.price !== "number" || input.price < 0) e.price = ["El precio no puede ser negativo."];
  if (typeof input?.number !== "number" || input.number < 0 || input.number > 99)
    e.number = ["El número debe estar entre 0 y 99."];
  return Object.keys(e).length ? e : null;
}

/** Datos listos para Prisma (create/update), con defaults y trims. */
export function toProductData(input: ProductInput, slug: string): Prisma.ProductUncheckedCreateInput {
  return {
    slug,
    team: input.team.trim(),
    type: input.type,
    number: input.number,
    price: input.price,
    fabric: (input.fabric ?? "").trim(),
    colorCss: input.colorCss?.trim() || "linear-gradient(160deg,#FFC44D,#DE9A26)",
    imageUrl: input.imageUrl?.trim() || null,
    description: (input.description ?? "").trim(),
    inStock: !!input.inStock,
  };
}
