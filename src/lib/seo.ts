import { ALL_SIZES, PRODUCT_TYPE_LABELS, type Product } from "./api";

/** "S a XXL" a partir de los talles que tiene el producto (en el orden estándar). */
export function sizeRange(sizes: string[]): string {
  const ordered = ALL_SIZES.filter((s) => sizes.includes(s));
  if (ordered.length === 0) return "";
  return ordered.length === 1 ? ordered[0] : `${ordered[0]} a ${ordered[ordered.length - 1]}`;
}

/** Descripción de un producto para Google (meta description, datos estructurados) y para la ficha.
 *  Si tiene una cargada a mano se usa esa; los productos importados vienen sin descripción, así que
 *  se arma una con lo que sí sabemos (nombre, versión, talles) en vez de dejar la página sin texto. */
export function productDescription(p: Pick<Product, "name" | "type" | "sizes" | "description">): string {
  const own = p.description.trim();
  if (own) return own;
  const sizes = sizeRange(p.sizes);
  return `${p.name} (${PRODUCT_TYPE_LABELS[p.type]}). Importado por Thor Importaciones, con envíos a todo el país.${sizes ? ` Talles ${sizes}.` : ""}`;
}
