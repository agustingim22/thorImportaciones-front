-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "club" TEXT;

-- CreateIndex
CREATE INDEX "Product_club_idx" ON "Product"("club");
