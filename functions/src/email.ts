import { defineSecret, defineString } from "firebase-functions/params";
import { logger } from "firebase-functions/v2";
import type { OrderLine } from "./types";

export const resendApiKey = defineSecret("RESEND_API_KEY");
/** resend.dev only delivers to the Resend account's own email — set this once a sending domain is verified. */
export const resendFromEmail = defineString("RESEND_FROM_EMAIL", {
  default: "Flossy Wears <onboarding@resend.dev>",
});

// Small, stable set of storefront details the confirmation email needs.
// Duplicated from src/lib/data/site.ts rather than imported — this codebase
// is a separate TypeScript project from the Next.js app (see types.ts).
const SITE = {
  name: "Flossy Wears",
  // TODO: switch back to https://flossywears.co.uk once that's the live domain.
  url: "https://flossy-wears.netlify.app",
  email: "flossywears@gmail.com",
  phone: "+44 20 7946 0958",
};

// Matches src/app/globals.css `--brand-*` tokens — duplicated for the same
// reason as SITE above (separate TS project, can't import across the
// functions/ boundary).
const COLORS = {
  navy: "#1e3a5f",
  gold: "#c8a44d",
  paper: "#fcfaf5",
  cream: "#f1eadb",
  ink: "#1f1b16",
  muted: "#6b675f",
  border: "#e5ddc8",
  green: "#2f6f3e",
};

function formatPrice(pence: number): string {
  return `£${(pence / 100).toFixed(2)}`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function button(text: string, href: string): string {
  return `
    <div style="text-align:center;margin:28px 0 4px">
      <a href="${href}" style="display:inline-block;background:${COLORS.navy};color:${COLORS.paper};text-decoration:none;font-size:14px;font-weight:600;letter-spacing:0.3px;padding:13px 30px;border-radius:8px">${text}</a>
    </div>`;
}

function productRowsHtml(lines: OrderLine[]): string {
  return lines
    .map((l) => {
      const custom = l.customVerse
        ? `
          <div style="margin-top:8px;padding:8px 10px;background:${COLORS.cream};border-left:2px solid ${COLORS.gold};border-radius:0 4px 4px 0">
            <span style="font-size:12.5px;color:${COLORS.ink};font-style:italic">&ldquo;${escapeHtml(l.customVerse.text)}&rdquo; — ${escapeHtml(l.customVerse.reference)}</span>
            ${l.customVerse.note ? `<div style="font-size:12px;color:${COLORS.muted};margin-top:3px">Note: ${escapeHtml(l.customVerse.note)}</div>` : ""}
          </div>`
        : "";
      return `
        <tr>
          <td style="padding:14px 0;border-bottom:1px solid ${COLORS.border};vertical-align:top;width:64px">
            <img src="${l.image}" alt="${escapeHtml(l.name)}" width="64" height="64" style="width:64px;height:64px;border-radius:8px;object-fit:cover;border:1px solid ${COLORS.border};display:block" />
          </td>
          <td style="padding:14px 0 14px 14px;border-bottom:1px solid ${COLORS.border};vertical-align:top">
            <div style="font-size:14.5px;font-weight:600;color:${COLORS.ink}">${escapeHtml(l.name)}</div>
            <div style="font-size:12.5px;color:${COLORS.muted};margin-top:2px">${escapeHtml(l.colourLabel)} · ${escapeHtml(l.size)} · Qty ${l.quantity}</div>
            ${custom}
          </td>
          <td style="padding:14px 0;border-bottom:1px solid ${COLORS.border};vertical-align:top;text-align:right;white-space:nowrap">
            <span style="font-size:14px;color:${COLORS.ink}">${formatPrice(l.price * l.quantity)}</span>
          </td>
        </tr>`;
    })
    .join("");
}

function emailShell(opts: { previewText: string; bodyHtml: string }): string {
  return `<!DOCTYPE html>
<html>
  <body style="margin:0;padding:0;background:${COLORS.cream};font-family:Georgia,'Times New Roman',serif">
    <span style="display:none;font-size:1px;color:${COLORS.cream};line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden">${escapeHtml(opts.previewText)}</span>
    <div style="max-width:560px;margin:0 auto;padding:32px 16px">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${COLORS.paper};border:1px solid ${COLORS.border};border-radius:14px;overflow:hidden">
        <tr>
          <td style="background:${COLORS.navy};padding:26px 32px;text-align:center">
            <span style="color:${COLORS.paper};font-size:18px;letter-spacing:4px;font-weight:700;text-transform:uppercase">Flossy Wears</span>
          </td>
        </tr>
        <tr>
          <td style="padding:36px 32px 8px">
            ${opts.bodyHtml}
          </td>
        </tr>
        <tr>
          <td style="padding:24px 32px 32px">
            <hr style="border:none;border-top:1px solid ${COLORS.border};margin:0 0 20px" />
            <p style="margin:0 0 6px;color:${COLORS.muted};font-size:12.5px;text-align:center">
              Questions? Reach us at <a href="mailto:${SITE.email}" style="color:${COLORS.navy}">${SITE.email}</a> or ${SITE.phone}
            </p>
            <p style="margin:0;color:${COLORS.muted};font-size:12px;text-align:center">${SITE.name} · Faith you can wear.</p>
          </td>
        </tr>
      </table>
    </div>
  </body>
</html>`;
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
        from: resendFromEmail.value(),
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
    .map((l) => {
      const base = `${l.quantity} × ${l.name} (${l.colourLabel} / ${l.size}) — ${formatPrice(l.price * l.quantity)}`;
      if (!l.customVerse) return base;
      const noteLine = l.customVerse.note ? ` — Note: ${l.customVerse.note}` : "";
      return `${base}\n  Custom print: "${l.customVerse.text}" — ${l.customVerse.reference}${noteLine}`;
    })
    .join("\n");
  const addressLine = [order.shippingAddress.line1, order.shippingAddress.line2, order.shippingAddress.city, order.shippingAddress.postcode]
    .filter(Boolean)
    .join(", ");
  const orderUrl = `${SITE.url}/account/orders/${order.number}`;

  const bodyHtml = `
    <h1 style="margin:0 0 6px;font-size:21px;color:${COLORS.ink}">Thanks for your order, ${escapeHtml(order.customerName)}</h1>
    <p style="margin:0 0 24px;font-size:14px;color:${COLORS.muted}">Order <strong style="color:${COLORS.ink}">${order.number}</strong> is confirmed and paid.</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${productRowsHtml(order.lines)}</table>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:18px;font-size:13.5px;color:${COLORS.muted}">
      <tr><td style="padding:3px 0">Subtotal</td><td style="padding:3px 0;text-align:right">${formatPrice(order.subtotal)}</td></tr>
      ${order.discount > 0 ? `<tr><td style="padding:3px 0">Discount</td><td style="padding:3px 0;text-align:right;color:${COLORS.green}">-${formatPrice(order.discount)}</td></tr>` : ""}
      <tr><td style="padding:3px 0">Delivery (${escapeHtml(order.shippingMethod)})</td><td style="padding:3px 0;text-align:right">${order.shipping === 0 ? "Free" : formatPrice(order.shipping)}</td></tr>
      <tr>
        <td style="padding:10px 0 0;border-top:1px solid ${COLORS.border};font-weight:700;color:${COLORS.ink};font-size:15px">Total paid</td>
        <td style="padding:10px 0 0;border-top:1px solid ${COLORS.border};text-align:right;font-weight:700;color:${COLORS.ink};font-size:15px">${formatPrice(order.total)}</td>
      </tr>
    </table>
    <div style="margin-top:20px;padding:14px 16px;background:${COLORS.cream};border-radius:8px">
      <div style="font-size:11px;text-transform:uppercase;letter-spacing:0.5px;color:${COLORS.muted};margin-bottom:4px">Delivering to</div>
      <div style="font-size:13.5px;color:${COLORS.ink}">${escapeHtml(addressLine)}</div>
    </div>
    ${button("Track your order", orderUrl)}
  `;

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
    html: emailShell({
      previewText: `Order ${order.number} is confirmed — ${formatPrice(order.total)} paid.`,
      bodyHtml,
    }),
  });
}
