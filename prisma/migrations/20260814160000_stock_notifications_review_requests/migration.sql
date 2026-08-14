-- AlterTable
ALTER TABLE "Order" ADD COLUMN "deliveredAt" TIMESTAMP(3);
ALTER TABLE "Order" ADD COLUMN "reviewRequestSentAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "StockNotification" (
    "id" SERIAL NOT NULL,
    "productId" INTEGER NOT NULL,
    "email" TEXT NOT NULL,
    "notified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StockNotification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "StockNotification_productId_email_key" ON "StockNotification"("productId", "email");

-- AddForeignKey
ALTER TABLE "StockNotification" ADD CONSTRAINT "StockNotification_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
