import "server-only";
import { Resend } from "resend";
import { SITE, SITE_URL } from "../site";

export function isEmailConfigured(): boolean {
  return !!process.env.RESEND_API_KEY;
}

const FROM = process.env.EMAIL_FROM || `${SITE.name} <onboarding@resend.dev>`;

/**
 * Envío base, nunca bloqueante: si el email falla (o no está configurado),
 * solo lo logueamos — el pedido/pago/registro ya se procesó igual.
 */
async function send(to: string, subject: string, html: string): Promise<void> {
  if (!isEmailConfigured()) return;
  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({ from: FROM, to, subject, html });
  } catch (err) {
    console.error("Error enviando email:", err);
  }
}

function layout(title: string, bodyHtml: string): string {
  return `<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#FAF4E7;font-family:Arial,Helvetica,sans-serif;">
    <div style="max-width:520px;margin:0 auto;padding:32px 20px;">
      <p style="font-weight:800;font-size:20px;letter-spacing:1px;color:#14323F;text-transform:uppercase;margin:0 0 24px;">
        ${SITE.name}
      </p>
      <div style="background:#ffffff;border:1px solid #E6D9C0;border-radius:16px;padding:28px;">
        <h1 style="font-size:20px;color:#14323F;margin:0 0 16px;">${title}</h1>
        ${bodyHtml}
      </div>
      <p style="margin:20px 0 0;font-size:12px;color:#9CA39A;text-align:center;">
        ${SITE.name} · ${SITE.email}
      </p>
    </div>
  </body>
</html>`;
}

function trackingLink(publicId: string): string {
  return `<p style="text-align:center;margin:20px 0 4px;">
    <a href="${SITE_URL}/pedido?id=${publicId}" style="color:#DE9A26;font-size:13px;font-weight:700;text-decoration:none;">
      Seguir el estado de mi pedido →
    </a>
  </p>`;
}

type OrderItemLine = {
  productName: string;
  unitPrice: number;
  quantity: number;
  size?: string | null;
  customName?: string | null;
  customNumber?: string | null;
  patchLabel?: string | null;
};

function itemsTable(items: OrderItemLine[]): string {
  const rows = items
    .map((i) => {
      const extras = [
        i.size && `Talle: ${i.size}`,
        i.customName && `Nombre: ${i.customName}`,
        i.customNumber && `N°: ${i.customNumber}`,
        i.patchLabel && `Parche: ${i.patchLabel}`,
      ]
        .filter(Boolean)
        .join(" · ");
      return `<tr>
        <td style="padding:8px 0;border-bottom:1px solid #eee;color:#14323F;font-size:14px;">
          <strong>${i.productName}</strong> x${i.quantity}
          ${extras ? `<br><span style="font-size:12px;color:#777;">${extras}</span>` : ""}
        </td>
        <td style="padding:8px 0;border-bottom:1px solid #eee;text-align:right;white-space:nowrap;color:#14323F;font-size:14px;">
          $${(i.unitPrice * i.quantity).toLocaleString("es-AR")}
        </td>
      </tr>`;
    })
    .join("");
  return `<table style="width:100%;border-collapse:collapse;">${rows}</table>`;
}

/** Pedido de catálogo (stock) recién creado. */
export async function sendOrderConfirmation(order: {
  publicId: string;
  customerEmail: string;
  customerName: string;
  total: number;
  items: OrderItemLine[];
}): Promise<void> {
  const body = `
    <p style="color:#5F6E68;font-size:14px;">Hola ${order.customerName}, recibimos tu pedido. Este es el resumen:</p>
    <p style="font-family:monospace;font-size:13px;color:#14323F;">Pedido #${order.publicId}</p>
    ${itemsTable(order.items)}
    <p style="text-align:right;font-size:16px;font-weight:800;color:#DE9A26;margin-top:14px;">
      Total: $${order.total.toLocaleString("es-AR")}
    </p>
    <p style="color:#5F6E68;font-size:13px;">Te avisamos apenas se confirme el pago.</p>
    ${trackingLink(order.publicId)}
  `;
  await send(order.customerEmail, `Pedido confirmado #${order.publicId}`, layout("¡Pedido recibido!", body));
}

/** Pedido personalizado (a medida) recién creado — no tiene precio cerrado todavía. */
export async function sendCustomOrderConfirmation(order: {
  publicId: string;
  customerEmail: string;
  customerName: string;
  items: {
    reference: string;
    referenceImageUrl?: string | null;
    fabric: string;
    size: string;
    patch: string | null;
    number: string | null;
    name: string | null;
  }[];
}): Promise<void> {
  if (!order.customerEmail) return; // el email es opcional en el pedido personalizado
  const rows = order.items
    .map((it) => {
      const extras = [
        it.patch && `Parche: ${it.patch}`,
        it.number && `N°: ${it.number}`,
        it.name && `Nombre: ${it.name}`,
      ]
        .filter(Boolean)
        .join(" · ");
      return `<li style="margin-bottom:10px;color:#14323F;font-size:14px;">
        ${it.reference} — ${it.fabric}, talle ${it.size}
        ${extras ? `<br><span style="font-size:12px;color:#777;">${extras}</span>` : ""}
        ${it.referenceImageUrl ? `<br><img src="${it.referenceImageUrl}" alt="" style="max-width:160px;border-radius:8px;margin-top:6px;">` : ""}
      </li>`;
    })
    .join("");
  const body = `
    <p style="color:#5F6E68;font-size:14px;">Hola ${order.customerName}, recibimos tu pedido personalizado.</p>
    <p style="font-family:monospace;font-size:13px;color:#14323F;">Pedido #${order.publicId}</p>
    <ul style="padding-left:18px;margin:12px 0;">${rows}</ul>
    <p style="color:#5F6E68;font-size:13px;">Te contactamos por WhatsApp para coordinar precio final, tiempos y forma de pago.</p>
    ${trackingLink(order.publicId)}
  `;
  await send(order.customerEmail, `Pedido personalizado recibido #${order.publicId}`, layout("¡Pedido recibido!", body));
}

/** Se cargó (o cambió) el código de seguimiento del envío. */
export async function sendShippingNotification(order: {
  publicId: string;
  customerEmail: string;
  customerName: string;
  trackingNumber: string;
}): Promise<void> {
  if (!order.customerEmail) return;
  const body = `
    <p style="color:#5F6E68;font-size:14px;">Hola ${order.customerName}, tu pedido ya está en camino.</p>
    <p style="font-family:monospace;font-size:13px;color:#14323F;">Pedido #${order.publicId}</p>
    <p style="margin:16px 0;padding:12px 16px;background:#FAF4E7;border-radius:10px;font-family:monospace;font-size:14px;color:#14323F;">
      Código de seguimiento: <strong>${order.trackingNumber}</strong>
    </p>
    ${trackingLink(order.publicId)}
  `;
  await send(order.customerEmail, `Tu pedido está en camino #${order.publicId}`, layout("¡Ya despachamos tu pedido!", body));
}

/** Se confirma el pago de un pedido de catálogo (transferencia validada o Mercado Pago). */
export async function sendPaymentConfirmation(order: {
  publicId: string;
  customerEmail: string;
  customerName: string;
  total: number;
}): Promise<void> {
  const body = `
    <p style="color:#5F6E68;font-size:14px;">Hola ${order.customerName}, confirmamos que recibimos tu pago.</p>
    <p style="font-family:monospace;font-size:13px;color:#14323F;">Pedido #${order.publicId}</p>
    <p style="text-align:right;font-size:16px;font-weight:800;color:#7C8A4C;">
      Total pagado: $${order.total.toLocaleString("es-AR")}
    </p>
    <p style="color:#5F6E68;font-size:13px;">Ya estamos preparando tu envío.</p>
    ${trackingLink(order.publicId)}
  `;
  await send(order.customerEmail, `Pago confirmado — pedido #${order.publicId}`, layout("¡Pago confirmado!", body));
}

/** Aviso interno al admin cuando entra un pedido nuevo (de stock o personalizado). */
export async function sendAdminOrderNotification(order: {
  publicId: string;
  kind: "Stock" | "Custom";
  customerName: string;
  customerPhone: string;
  total: number;
  itemsSummary: string;
}): Promise<void> {
  const body = `
    <p style="color:#5F6E68;font-size:14px;">
      Entró un pedido ${order.kind === "Custom" ? "personalizado" : "de stock"} nuevo.
    </p>
    <p style="font-family:monospace;font-size:13px;color:#14323F;">Pedido #${order.publicId}</p>
    <p style="color:#14323F;font-size:14px;margin:4px 0;">
      <strong>${order.customerName}</strong> · ${order.customerPhone}
    </p>
    <p style="color:#5F6E68;font-size:13px;">${order.itemsSummary}</p>
    ${
      order.total > 0
        ? `<p style="text-align:right;font-size:16px;font-weight:800;color:#DE9A26;margin-top:14px;">Total: $${order.total.toLocaleString("es-AR")}</p>`
        : `<p style="color:#5F6E68;font-size:13px;"><em>Precio a coordinar.</em></p>`
    }
    <p style="text-align:center;margin:20px 0 4px;">
      <a href="${SITE_URL}/admin" style="color:#DE9A26;font-size:13px;font-weight:700;text-decoration:none;">
        Ver en el panel →
      </a>
    </p>
  `;
  await send(
    SITE.adminEmail,
    `Pedido nuevo #${order.publicId} — ${order.customerName}`,
    layout("¡Pedido nuevo!", body),
  );
}

/** Aviso interno al admin cuando una venta deja un producto en 0 unidades. */
export async function sendOutOfStockAlert(
  products: { team: string; slug: string }[],
): Promise<void> {
  const rows = products
    .map(
      (p) => `<li style="margin-bottom:8px;color:#14323F;font-size:14px;">
        ${p.team}
        <br><a href="${SITE_URL}/admin" style="font-size:12px;color:#DE9A26;">Reponer stock →</a>
      </li>`,
    )
    .join("");
  const body = `
    <p style="color:#5F6E68;font-size:14px;">
      Se quedaron sin stock ${products.length > 1 ? "estas camisetas" : "esta camiseta"}:
    </p>
    <ul style="padding-left:18px;margin:12px 0;">${rows}</ul>
  `;
  const subject =
    products.length > 1
      ? `${products.length} camisetas sin stock`
      : `"${products[0].team}" se quedó sin stock`;
  await send(SITE.adminEmail, subject, layout("Stock agotado", body));
}

/** Aviso interno cuando alguien deja una pregunta nueva sobre un producto. */
export async function sendAdminNewQuestion(q: {
  productTeam: string;
  name: string;
  question: string;
}): Promise<void> {
  const body = `
    <p style="color:#5F6E68;font-size:14px;">
      <strong>${q.name}</strong> preguntó sobre "${q.productTeam}":
    </p>
    <p style="margin:12px 0;padding:12px 16px;background:#FAF4E7;border-radius:10px;color:#14323F;font-size:14px;">
      ${q.question}
    </p>
    <p style="text-align:center;margin:20px 0 4px;">
      <a href="${SITE_URL}/admin" style="color:#DE9A26;font-size:13px;font-weight:700;text-decoration:none;">
        Responder en el panel →
      </a>
    </p>
  `;
  await send(SITE.adminEmail, `Pregunta nueva sobre "${q.productTeam}"`, layout("Pregunta de un visitante", body));
}

/** Aviso a un comprador que pidió que le avisen cuando un producto vuelva a tener stock. */
export async function sendStockBackNotification(to: {
  email: string;
  team: string;
  slug: string;
}): Promise<void> {
  const body = `
    <p style="color:#5F6E68;font-size:14px;">
      "${to.team}" volvió a tener stock. Si todavía te interesa, no esperes mucho —
      no sabemos cuánto va a durar.
    </p>
    <p style="text-align:center;margin:24px 0;">
      <a href="${SITE_URL}/producto/${to.slug}" style="background:#DE9A26;color:#14323F;font-weight:800;text-decoration:none;padding:12px 24px;border-radius:10px;display:inline-block;">
        Ver "${to.team}" →
      </a>
    </p>
  `;
  await send(to.email, `¡Ya hay stock de "${to.team}"!`, layout("Volvió el stock", body));
}

/** Recordatorio de carrito abandonado (usuarios logueados con carrito guardado sin comprar). */
export async function sendCartReminder(to: {
  email: string;
  customerName: string;
  items: { team: string; qty: number }[];
}): Promise<void> {
  if (!to.email || to.items.length === 0) return;
  const rows = to.items
    .map(
      (i) => `<li style="margin-bottom:8px;color:#14323F;font-size:14px;">${i.team} x${i.qty}</li>`,
    )
    .join("");
  const body = `
    <p style="color:#5F6E68;font-size:14px;">
      Hola ${to.customerName}, dejaste esto en tu carrito. Sigue disponible, pero no te
      prometemos que el stock dure para siempre.
    </p>
    <ul style="padding-left:18px;margin:12px 0;">${rows}</ul>
    <p style="text-align:center;margin:24px 0;">
      <a href="${SITE_URL}/carrito" style="background:#DE9A26;color:#14323F;font-weight:800;text-decoration:none;padding:12px 24px;border-radius:10px;display:inline-block;">
        Terminar mi compra →
      </a>
    </p>
  `;
  await send(to.email, "Te olvidaste algo en el carrito", layout("Tu carrito te espera", body));
}

/** Pide una reseña unos días después de que el pedido se marca como entregado. */
export async function sendReviewRequest(to: {
  email: string;
  customerName: string;
  products: { team: string; slug: string }[];
}): Promise<void> {
  if (!to.email || to.products.length === 0) return;
  const rows = to.products
    .map(
      (p) => `<li style="margin-bottom:10px;color:#14323F;font-size:14px;">
        ${p.team}
        <br><a href="${SITE_URL}/producto/${p.slug}#resenas" style="font-size:12px;color:#DE9A26;">Dejar mi reseña →</a>
      </li>`,
    )
    .join("");
  const body = `
    <p style="color:#5F6E68;font-size:14px;">
      Hola ${to.customerName}, esperamos que estés disfrutando tu pedido. ¿Nos contás cómo te fue?
      Tu reseña ayuda a otros hinchas a decidirse.
    </p>
    <ul style="padding-left:18px;margin:12px 0;">${rows}</ul>
  `;
  await send(to.email, "¿Cómo te fue con tu pedido?", layout("Contanos qué te pareció", body));
}

/** Link para restablecer la contraseña. */
export async function sendPasswordReset(email: string, resetUrl: string): Promise<void> {
  const body = `
    <p style="color:#5F6E68;font-size:14px;">
      Recibimos una solicitud para restablecer tu contraseña. Si no fuiste vos, ignorá este email.
    </p>
    <p style="text-align:center;margin:24px 0;">
      <a href="${resetUrl}" style="background:#DE9A26;color:#14323F;font-weight:800;text-decoration:none;padding:12px 24px;border-radius:10px;display:inline-block;">
        Restablecer contraseña
      </a>
    </p>
    <p style="color:#9CA39A;font-size:12px;">Este link vence en 1 hora.</p>
  `;
  await send(email, "Restablecer tu contraseña", layout("Restablecer contraseña", body));
}
