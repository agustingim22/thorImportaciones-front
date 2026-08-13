import "server-only";
import { prisma } from "./prisma";

export type HeroImage = {
  id: number;
  imageUrl: string;
};

/** Fotos del carrusel de la portada, en el orden en que deben mostrarse. */
export async function getHeroImages(): Promise<HeroImage[]> {
  const rows = await prisma.heroImage.findMany({ orderBy: { position: "asc" } });
  return rows.map((r) => ({ id: r.id, imageUrl: r.imageUrl }));
}
