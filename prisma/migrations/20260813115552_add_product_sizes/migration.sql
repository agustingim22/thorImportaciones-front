-- AlterTable
ALTER TABLE "Product" ADD COLUMN "sizes" TEXT[] NOT NULL DEFAULT ARRAY['S','M','L','XL','XXL']::TEXT[];

-- AlterTable
ALTER TABLE "OrderItem" ADD COLUMN "size" TEXT;
