-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "rank" INTEGER NOT NULL DEFAULT 1;

-- Backfill: mismas reglas que src/lib/ranking.ts (productRank)
UPDATE "Product" SET "rank" = CASE
  WHEN "type" IN ('nba', 'rugby') THEN 3
  WHEN "type" IN ('fan', 'player', 'retro') AND "club" IS NOT NULL THEN 0
  WHEN "type" IN ('fan', 'player', 'retro') THEN 1
  ELSE 2
END;

-- CreateIndex
CREATE INDEX "Product_rank_createdAt_idx" ON "Product"("rank", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "Product_type_rank_createdAt_idx" ON "Product"("type", "rank", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "Product_club_rank_createdAt_idx" ON "Product"("club", "rank", "createdAt" DESC);
