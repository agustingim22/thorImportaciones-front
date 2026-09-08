/** Hosts cuyas imágenes ya vienen redimensionadas/comprimidas por el proveedor,
 *  por lo que no necesitan pasar por el optimizador de imágenes de Vercel (que
 *  tiene una cuota de imágenes únicas procesadas por mes — con miles de fotos
 *  de productos la superábamos y algunas imágenes tiraban 402). */
const UNOPTIMIZED_HOSTS = ["ssl.images-ssl-mars.com"];

export function isUnoptimizedImage(src: string): boolean {
  return UNOPTIMIZED_HOSTS.some((host) => src.includes(host));
}
