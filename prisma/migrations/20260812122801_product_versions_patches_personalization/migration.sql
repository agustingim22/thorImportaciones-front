-- 1) Agregar las columnas nuevas de Product (todavía nullable, sin tocar las viejas)
ALTER TABLE "Product"
  ADD COLUMN "images"       TEXT[] DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "presetName"   TEXT,
  ADD COLUMN "presetNumber" TEXT;

-- 2) Backfill: migrar los datos existentes a las columnas nuevas antes de borrar las viejas
UPDATE "Product"
SET "images" = CASE WHEN "imageUrl" IS NOT NULL THEN ARRAY["imageUrl"] ELSE ARRAY[]::TEXT[] END,
    "presetNumber" = "number"::TEXT;

-- 3) Ahora sí, borrar las columnas viejas (fabric, imageUrl, number)
ALTER TABLE "Product"
  DROP COLUMN "fabric",
  DROP COLUMN "imageUrl",
  DROP COLUMN "number";

-- 4) Nueva tabla de parches (opciones de personalización por producto)
CREATE TABLE "Patch" (
    "id" SERIAL NOT NULL,
    "productId" INTEGER NOT NULL,
    "label" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "extraPrice" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Patch_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "Patch" ADD CONSTRAINT "Patch_productId_fkey"
  FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 5) Campos de personalización elegida en cada línea de pedido
ALTER TABLE "OrderItem"
  ADD COLUMN "customName"      TEXT,
  ADD COLUMN "customNumber"    TEXT,
  ADD COLUMN "patchExtraPrice" INTEGER,
  ADD COLUMN "patchLabel"      TEXT;
