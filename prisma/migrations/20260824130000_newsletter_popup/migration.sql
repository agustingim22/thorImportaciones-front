-- CreateTable
CREATE TABLE "NewsletterPopupSettings" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "couponCode" TEXT,
    "headline" TEXT NOT NULL DEFAULT 'Sumate y conseguí un cupón de descuento',
    "subtext" TEXT NOT NULL DEFAULT 'Enterate primero de nuevas camisetas, drops y promos exclusivas.',

    CONSTRAINT "NewsletterPopupSettings_pkey" PRIMARY KEY ("id")
);
