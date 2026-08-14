-- AlterTable
ALTER TABLE "Order" ADD COLUMN "shippingCost" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "ShippingSettings" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "flatCost" INTEGER NOT NULL DEFAULT 0,
    "freeShippingThreshold" INTEGER,

    CONSTRAINT "ShippingSettings_pkey" PRIMARY KEY ("id")
);
