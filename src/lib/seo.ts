import { ALL_SIZES, PRODUCT_TYPE_LABELS, type Product } from "./api";
import { SITE } from "./site";

// El layout agrega este sufijo a todos los títulos ("%s — Thor Importaciones").
const TITLE_SUFFIX = ` — ${SITE.name}`;
// Google corta los títulos alrededor de los 60-70 caracteres; se apunta a no pasar de 66 con todo.
const TITLE_MAX = 66;

/** Título de una ficha de producto. Si con el sufijo de la marca se pasa de largo, se manda sin el sufijo, y si
 *  el nombre solo ya es largo se corta en el último " · " que entre ("Real Madrid · Edición especial …"). */
export function productTitle(name: string): string | { absolute: string } {
  if (name.length + TITLE_SUFFIX.length <= TITLE_MAX) return name;
  if (name.length <= TITLE_MAX) return { absolute: name };
  const parts = name.split(" · ");
  while (parts.length > 1 && parts.join(" · ").length > TITLE_MAX) parts.pop();
  const cut = parts.join(" · ");
  return { absolute: cut.length <= TITLE_MAX ? cut : `${cut.slice(0, TITLE_MAX - 1).trimEnd()}…` };
}

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
