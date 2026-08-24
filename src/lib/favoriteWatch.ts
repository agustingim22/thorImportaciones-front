import "server-only";
import { prisma } from "./prisma";
import { sendLowStockAlert } from "./server/email";
import { LOW_STOCK_THRESHOLD } from "./api";

/** Registra (o confirma) que un email quiere que le avisen si estos productos se
 *  quedan sin stock / con pocas unidades. Idempotente: repetir no duplica ni molesta. */
export async function registerFavoriteWatch(email: string, productIds: number[]): Promise<void> {
  await Promise.all(
    productIds.map((productId) =>
      prisma.favoriteWatch.upsert({
        where: { productId_email: { productId, email } },
        create: { productId, email },
        update: {},
      }),
    ),
  );
}

/**
 * Se llama después de cualquier cambio de stock (compra o edición desde el admin).
 * Si el stock cruzó hacia abajo del umbral bajo (o a 0), avisa a quienes tengan el
 * producto en watch y todavía no fueron avisados por esta caída. Si el stock se
 * recuperó por encima del umbral, resetea el aviso para que pueda dispararse de
 * nuevo la próxima vez que vuelva a bajar.
 */
export async function checkFavoriteStockCrossing(
  productId: number,
  previousStock: number,
  newStock: number,
): Promise<void> {
  const wasAboveThreshold = previousStock > LOW_STOCK_THRESHOLD;
  const isAtOrBelowThreshold = newStock <= LOW_STOCK_THRESHOLD;

  if (wasAboveThreshold && isAtOrBelowThreshold) {
    const watches = await prisma.favoriteWatch.findMany({
      where: { productId, notifiedAt: null },
      include: { product: true },
    });
    if (watches.length === 0) return;

    await Promise.all(
      watches.map((w) =>
        sendLowStockAlert({
          email: w.email,
          team: w.product.team,
          slug: w.product.slug,
          stock: newStock,
        }).catch(() => {}),
      ),
    );
    await prisma.favoriteWatch.updateMany({
      where: { id: { in: watches.map((w) => w.id) } },
      data: { notifiedAt: new Date() },
    });
  } else if (!wasAboveThreshold && newStock > LOW_STOCK_THRESHOLD) {
    await prisma.favoriteWatch.updateMany({
      where: { productId, notifiedAt: { not: null } },
      data: { notifiedAt: null },
    });
  }
}
