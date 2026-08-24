-- CreateTable
CREATE TABLE "FavoriteWatch" (
    "id" SERIAL NOT NULL,
    "productId" INTEGER NOT NULL,
    "email" TEXT NOT NULL,
    "notifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FavoriteWatch_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "FavoriteWatch_productId_email_key" ON "FavoriteWatch"("productId", "email");

-- AddForeignKey
ALTER TABLE "FavoriteWatch" ADD CONSTRAINT "FavoriteWatch_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
