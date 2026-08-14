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
