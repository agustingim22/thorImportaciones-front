-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "bundleApplied" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "SearchTerm" (
    "id" SERIAL NOT NULL,
    "term" TEXT NOT NULL,
    "searches" INTEGER NOT NULL DEFAULT 1,
    "results" INTEGER NOT NULL DEFAULT 0,
    "firstAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SearchTerm_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BundleSettings" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "minQty" INTEGER NOT NULL DEFAULT 2,
    "percent" INTEGER NOT NULL DEFAULT 10,

    CONSTRAINT "BundleSettings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SearchTerm_term_key" ON "SearchTerm"("term");

-- CreateIndex
CREATE INDEX "SearchTerm_results_searches_idx" ON "SearchTerm"("results", "searches" DESC);
