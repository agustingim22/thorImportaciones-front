import "server-only";
import { prisma } from "./prisma";

export type Review = {
  id: number;
  name: string;
  rating: number;
  comment: string;
  createdAt: string;
};

/** Reseñas publicadas de un producto, para mostrar en su página. */
export async function getProductReviews(productId: number): Promise<Review[]> {
  const rows = await prisma.review.findMany({
    where: { productId, published: true },
    orderBy: { createdAt: "desc" },
  });
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    rating: r.rating,
    comment: r.comment,
    createdAt: r.createdAt.toISOString(),
  }));
}
