-- 1) Agregar la columna nueva (con default 0, todavía sin tocar la vieja)
ALTER TABLE "Product" ADD COLUMN "stock" INTEGER NOT NULL DEFAULT 0;

-- 2) Backfill: los productos que estaban "en stock" reciben una cantidad
--    inicial razonable (5 unidades) para no desaparecer del catálogo;
--    el admin ajusta la cantidad real después desde el panel.
UPDATE "Product" SET "stock" = 5 WHERE "inStock" = true;

-- 3) Ahora sí, borrar la columna vieja
ALTER TABLE "Product" DROP COLUMN "inStock";
