import { defineSecret } from "firebase-functions/params";
import { logger } from "firebase-functions/v2";
import type { OrderLine } from "./types";

export const resendApiKey = defineSecret("RESEND_API_KEY");

// Small, stable set of storefront details the confirmation email needs.
// Duplicated from src/lib/data/site.ts rather than imported — this codebase
// is a separate TypeScript project from the Next.js app (see types.ts).
const SITE = {
  name: "Flossy Wears",
  url: "https://flossywears.co.uk",
  email: "hello@flossywears.co.uk",
  phone: "+44 20 7946 0958",
};

function formatPrice(pence: number): string {
  return `£${(pence / 100).toFixed(2)}`;
}

/** Best-effort send via Resend's REST API — a failed/unconfigured send must never block order fulfillment. */
async function sendEmail(input: { to: string; subject: string; html: string; text: string }) {
  const apiKey = resendApiKey.value();
  if (!apiKey) {
    logger.warn("sendEmail: RESEND_API_KEY not configured, skipping", { to: input.to, subject: input.subject });
    return;
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { authorization: `Bearer ${apiKey}`, "content-type": "application/json" },
      body: JSON.stringify({
        from: `${SITE.name} <onboarding@resend.dev>`,
        to: input.to,
        subject: input.subject,
        html: input.html,
        text: input.text,
      }),
    });
    if (!res.ok) {
      logger.error(`sendEmail: Resend ${res.status}`, { body: await res.text().catch(() => "") });
    }
  } catch (err) {
    logger.error("sendEmail: request failed", err);
  }
}

export async function sendOrderConfirmationEmail(order: {
  number: string;
  customerEmail: string;
  customerName: string;
  lines: OrderLine[];
  subtotal: number;
  shipping: number;
  discount: number;
  total: number;
  shippingMethod: string;
  shippingAddress: {
    line1: string;
    line2?: string;
    city: string;
    postcode: string;
  };
}) {
  const itemRows = order.lines
    .map(
      (l) =>
        `${l.quantity} × ${l.name} (${l.colourLabel} / ${l.size}) — ${formatPrice(l.price * l.quantity)}`,
    )
    .join("\n");
  const itemRowsHtml = order.lines
    .map(
      (l) => `
        <tr>
          <td style="padding:6px 0">${l.quantity} × ${l.name}<br/><span style="color:#666;font-size:13px">${l.colourLabel} / ${l.size}</span></td>
          <td style="padding:6px 0;text-align:right">${formatPrice(l.price * l.quantity)}</td>
        </tr>`,
    )
    .join("");
  const addressLine = [order.shippingAddress.line1, order.shippingAddress.line2, order.shippingAddress.city, order.shippingAddress.postcode]
    .filter(Boolean)
    .join(", ");
  const orderUrl = `${SITE.url}/account/orders/${order.number}`;

  await sendEmail({
    to: order.customerEmail,
    subject: `Order confirmed — ${order.number} — ${SITE.name}`,
    text: [
      `Thanks for your order, ${order.customerName}!`,
      `Order ${order.number} is confirmed and paid.`,
      "",
      "Items:",
      itemRows,
      "",
      `Subtotal: ${formatPrice(order.subtotal)}`,
      order.discount > 0 ? `Discount: -${formatPrice(order.discount)}` : "",
      `Delivery (${order.shippingMethod}): ${order.shipping === 0 ? "Free" : formatPrice(order.shipping)}`,
      `Total paid: ${formatPrice(order.total)}`,
      "",
      `Delivering to: ${addressLine}`,
      "",
      `Track your order: ${orderUrl}`,
      "",
      `Questions? Reach us at ${SITE.email} or ${SITE.phone}.`,
    ]
      .filter((l) => l !== "")
      .join("\n"),
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;color:#1a1a1a">
        <h2>Thanks for your order, ${order.customerName}!</h2>
        <p>Order <strong>${order.number}</strong> is confirmed and paid.</p>
        <table style="width:100%;border-collapse:collapse;margin:16px 0">
          ${itemRowsHtml}
        </table>
        <table style="width:100%;font-size:14px;color:#333">
          <tr><td>Subtotal</td><td style="text-align:right">${formatPrice(order.subtotal)}</td></tr>
          ${order.discount > 0 ? `<tr><td>Discount</td><td style="text-align:right">-${formatPrice(order.discount)}</td></tr>` : ""}
          <tr><td>Delivery (${order.shippingMethod})</td><td style="text-align:right">${order.shipping === 0 ? "Free" : formatPrice(order.shipping)}</td></tr>
          <tr style="font-weight:bold"><td>Total paid</td><td style="text-align:right">${formatPrice(order.total)}</td></tr>
        </table>
        <p style="margin-top:16px">Delivering to: ${addressLine}</p>
        <p><a href="${orderUrl}">Track your order</a></p>
        <p style="color:#666;font-size:13px;margin-top:24px">
          Questions? Reach us at <a href="mailto:${SITE.email}">${SITE.email}</a> or ${SITE.phone}.
        </p>
        <p style="color:#666;font-size:13px">${SITE.name}</p>
      </div>
    `,
  });
}
