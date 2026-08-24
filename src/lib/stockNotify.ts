export async function notifyStockAvailable(productId: number, email: string): Promise<void> {
  const res = await fetch(`/api/products/${productId}/notify-stock`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  if (!res.ok) {
    let msg = "No se pudo registrar el aviso.";
    try {
      const data = await res.json();
      if (data?.error) msg = data.error;
    } catch {
      /* sin cuerpo */
    }
    throw new Error(msg);
  }
}

/** Pide que avisen por email si alguno de estos productos favoritos se queda sin stock/con pocas unidades. */
export async function registerFavoritesWatch(email: string, productIds: number[]): Promise<void> {
  const res = await fetch(`/api/favorites/watch`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, productIds }),
  });
  if (!res.ok) {
    let msg = "No se pudo registrar el aviso.";
    try {
      const data = await res.json();
      if (data?.error) msg = data.error;
    } catch {
      /* sin cuerpo */
    }
    throw new Error(msg);
  }
}
