-- CreateTable
CREATE TABLE "PriceChange" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "percent" DOUBLE PRECISION NOT NULL,
    "rounding" INTEGER NOT NULL,
    "scope" JSONB NOT NULL,
    "count" INTEGER NOT NULL,
    "items" JSONB NOT NULL,
    "revertedAt" TIMESTAMP(3),

    CONSTRAINT "PriceChange_pkey" PRIMARY KEY ("id")
);

