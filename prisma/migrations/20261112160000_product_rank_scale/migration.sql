-- El ranking pasó de un número de grupo (0-3) a un entero compuesto:
--   rank = grupo × 10.000.000 + tier × 1.000.000 + secuencia × 100 + prio
-- (ver src/lib/ranking.ts). Los productos que ya existían conservan su grupo (tier, secuencia y prio en 0, así
-- que siguen ordenados por fecha dentro de cada grupo) hasta que se corra la clasificación
-- (admin > Equipos > Aplicar, o el proceso diario), que calcula el orden completo.
UPDATE "Product" SET "rank" = "rank" * 10000000;
