import "server-only";
import { Resend } from "resend";
import { SITE } from "../site";

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

type OrderItemLine = {
  productName: string;
  unitPrice: number;
  quantity: number;
  customName?: string | null;
  customNumber?: string | null;
  patchLabel?: string | null;
};

function itemsTable(items: OrderItemLine[]): string {
  const rows = items
    .map((i) => {
      const extras = [
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
  `;
  await send(order.customerEmail, `Pedido confirmado #${order.publicId}`, layout("¡Pedido recibido!", body));
}

/** Pedido personalizado (a medida) recién creado — no tiene precio cerrado todavía. */
export async function sendCustomOrderConfirmation(order: {
  publicId: string;
  customerEmail: string;
  customerName: string;
  items: { reference: string; fabric: string; size: string; patch: string | null; number: string | null; name: string | null }[];
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
      </li>`;
    })
    .join("");
  const body = `
    <p style="color:#5F6E68;font-size:14px;">Hola ${order.customerName}, recibimos tu pedido personalizado.</p>
    <p style="font-family:monospace;font-size:13px;color:#14323F;">Pedido #${order.publicId}</p>
    <ul style="padding-left:18px;margin:12px 0;">${rows}</ul>
    <p style="color:#5F6E68;font-size:13px;">Te contactamos por WhatsApp para coordinar precio final, tiempos y forma de pago.</p>
  `;
  await send(order.customerEmail, `Pedido personalizado recibido #${order.publicId}`, layout("¡Pedido recibido!", body));
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
  `;
  await send(order.customerEmail, `Pago confirmado — pedido #${order.publicId}`, layout("¡Pago confirmado!", body));
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
