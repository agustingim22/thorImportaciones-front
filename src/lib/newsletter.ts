export type NewsletterPopupPublic = {
  enabled: boolean;
  headline: string;
  subtext: string;
  discountLabel: string | null;
};

export async function getNewsletterPopup(): Promise<NewsletterPopupPublic> {
  const res = await fetch("/api/newsletter-popup");
  if (!res.ok) return { enabled: false, headline: "", subtext: "", discountLabel: null };
  return res.json();
}

export async function subscribeNewsletter(email: string, wantsCoupon = false): Promise<void> {
  const res = await fetch("/api/newsletter", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, wantsCoupon }),
  });
  if (!res.ok) {
    let msg = "No se pudo suscribir.";
    try {
      const data = await res.json();
      if (data?.error) msg = data.error;
    } catch {
      /* sin cuerpo */
    }
    throw new Error(msg);
  }
}
