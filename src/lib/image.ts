/** Hosts cuyas imágenes ya vienen redimensionadas/comprimidas por el proveedor,
 *  por lo que no necesitan pasar por el optimizador de imágenes de Vercel (que
 *  tiene una cuota de imágenes únicas procesadas por mes — con miles de fotos
 *  de productos la superábamos y algunas imágenes tiraban 402). */
const UNOPTIMIZED_HOSTS = ["ssl.images-ssl-mars.com"];

export function isUnoptimizedImage(src: string): boolean {
  return UNOPTIMIZED_HOSTS.some((host) => src.includes(host));
}

// Las URLs del proveedor traen su propio resize on-the-fly (Aliyun OSS:
// ".../w_1500,h_1500/..."). Como estas imágenes no pasan por el optimizador de
// Vercel (ver isUnoptimizedImage), si no achicamos el pedido acá se baja la
// foto de 1500x1500 completa (~180KB) aunque se muestre como una miniatura de
// 60px — de ahí pedirle directo al proveedor el tamaño que realmente se usa.
const RESIZE_PATTERN = /w_\d+,h_\d+/;

/** Pide al proveedor una versión más chica de la imagen (mismo aspect ratio,
 *  `m_lfit` no recorta). No hace nada si la URL no es del proveedor. */
export function resizeSupplierImage(src: string, size: number): string {
  if (!isUnoptimizedImage(src)) return src;
  return src.replace(RESIZE_PATTERN, `w_${size},h_${size}`);
}
