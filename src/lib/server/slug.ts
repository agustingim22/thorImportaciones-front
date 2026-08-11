import "server-only";
import { prisma } from "../prisma";

const DIACRITICS = new RegExp("[\\u0300-\\u036f]", "g");

/** "Retro River 1996" → "retro-river-1996" (sin acentos ni símbolos). */
export function slugify(text: string): string {
  return text
    .normalize("NFD")
    .replace(DIACRITICS, "") // quita acentos combinados
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Genera un slug único (agrega -2, -3… si ya existe). */
export async function uniqueSlug(source: string, excludeId?: number): Promise<string> {
  const base = slugify(source) || "camiseta";
  let slug = base;
  let n = 2;
  for (;;) {
    const existing = await prisma.product.findUnique({ where: { slug } });
    if (!existing || existing.id === excludeId) return slug;
    slug = `${base}-${n++}`;
  }
}
