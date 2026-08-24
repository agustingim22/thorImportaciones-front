import "server-only";
import { prisma } from "./prisma";

/** Links de los posts elegidos a mano por el admin, para mostrar en la home. */
export async function getInstagramPosts(limit = 6): Promise<string[]> {
  const rows = await prisma.instagramPost.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
  });
  return rows.map((r) => r.url);
}
