-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "notes" TEXT;

-- CreateTable
CREATE TABLE "CustomItem" (
    "id" SERIAL NOT NULL,
    "orderId" INTEGER NOT NULL,
    "reference" TEXT NOT NULL,
    "fabric" TEXT NOT NULL,
    "size" TEXT NOT NULL,
    "patch" TEXT,
    "number" TEXT,
    "name" TEXT,

    CONSTRAINT "CustomItem_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "CustomItem" ADD CONSTRAINT "CustomItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
