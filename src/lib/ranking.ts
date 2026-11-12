/**
 * Orden "Destacados" del catálogo (el que se ve por defecto).
 *
 * Sin esto el catálogo se ordena por fecha de carga, y el último lote que se importa (por ejemplo
 * shorts) se queda con todas las primeras páginas. Con el ranking, primero van las camisetas de los
 * equipos destacados, después las demás camisetas, y al final los shorts, las remeras y el NBA/rugby;
 * dentro de cada grupo, lo más nuevo primero.
 *
 *   0 → camisetas de fútbol (fan, jugador, retro) de un equipo destacado
 *   1 → otras camisetas de fútbol
 *   2 → shorts, remeras, conjuntos
 *   3 → NBA y rugby
 *
 * Se guarda en `Product.rank` para poder ordenar con un índice. Hay que mantenerlo al crear/editar un
 * producto y al clasificar (ver toProductData y classifyClubs). La migración `product_rank` hace lo
 * mismo en SQL para los productos que ya existían: si se cambian las reglas, cambiarlas en los dos lados.
 */
const JERSEY_TYPES = ["fan", "player", "retro"];

export function productRank(type: string, club: string | null | undefined): number {
  if (type === "nba" || type === "rugby") return 3;
  if (JERSEY_TYPES.includes(type)) return club ? 0 : 1;
  return 2;
}
