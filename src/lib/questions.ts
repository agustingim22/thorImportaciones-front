import "server-only";
import { prisma } from "./prisma";

export type ProductQuestion = {
  id: number;
  name: string;
  question: string;
  answer: string;
  createdAt: string;
};

/** Preguntas ya respondidas de un producto, para mostrar en su página. */
export async function getProductQuestions(productId: number): Promise<ProductQuestion[]> {
  const rows = await prisma.productQuestion.findMany({
    where: { productId, answer: { not: null } },
    orderBy: { answeredAt: "desc" },
  });
  return rows.map((q) => ({
    id: q.id,
    name: q.name,
    question: q.question,
    answer: q.answer!,
    createdAt: q.createdAt.toISOString(),
  }));
}
