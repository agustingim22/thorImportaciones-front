import "server-only";
import { prisma } from "./prisma";

export type Testimonial = {
  id: number;
  name: string;
  comment: string;
  rating: number;
  createdAt: string;
};

/** Testimonios publicados, para mostrar en la web. */
export async function getPublishedTestimonials(limit = 6): Promise<Testimonial[]> {
  const rows = await prisma.testimonial.findMany({
    where: { published: true },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
  return rows.map((t) => ({
    id: t.id,
    name: t.name,
    comment: t.comment,
    rating: t.rating,
    createdAt: t.createdAt.toISOString(),
  }));
}
