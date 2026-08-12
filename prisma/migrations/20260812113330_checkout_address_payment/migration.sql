/*
  Warnings:

  - You are about to drop the column `shippingAddress` on the `Order` table. All the data in the column will be lost.
  - Added the required column `city` to the `Order` table without a default value. This is not possible if the table is not empty.
  - Added the required column `postalCode` to the `Order` table without a default value. This is not possible if the table is not empty.
  - Added the required column `province` to the `Order` table without a default value. This is not possible if the table is not empty.
  - Added the required column `street` to the `Order` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Order" DROP COLUMN "shippingAddress",
ADD COLUMN     "apartment" TEXT,
ADD COLUMN     "city" TEXT NOT NULL,
ADD COLUMN     "deliveryNotes" TEXT,
ADD COLUMN     "floor" TEXT,
ADD COLUMN     "paymentMethod" TEXT,
ADD COLUMN     "postalCode" TEXT NOT NULL,
ADD COLUMN     "province" TEXT NOT NULL,
ADD COLUMN     "receiptUrl" TEXT,
ADD COLUMN     "street" TEXT NOT NULL;
