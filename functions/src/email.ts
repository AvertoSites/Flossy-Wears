import { defineSecret, defineString } from "firebase-functions/params";
import { logger } from "firebase-functions/v2";
import { COLLECTION_POINT, isCollectionOrder } from "./collection";
import type { CollectionContact, CollectionPoint, DeliveryType, OrderLine } from "./types";

export const resendApiKey = defineSecret("RESEND_API_KEY");
/** resend.dev only delivers to the Resend account's own email — set this once a sending domain is verified. */
export const resendFromEmail = defineString("RESEND_FROM_EMAIL", {
  default: "Flossy Wears <onboarding@resend.dev>",
});
/** Who gets the "new order" alert — comma-separate several addresses. */
export const adminNotifyEmail = defineString("ADMIN_NOTIFY_EMAIL", {
  default: "flossywears@gmail.com",
});

// Small, stable set of storefront details the confirmation email needs.
// Duplicated from src/lib/data/site.ts rather than imported — this codebase
// is a separate TypeScript project from the Next.js app (see types.ts).
const SITE = {
  name: "Flossy Wears",
  // TODO: switch back to https://flossywears.co.uk once that's the live domain.
  url: "https://flossy-wears.netlify.app",
  email: "flossywears@gmail.com",
  phone: "+44 7935 828743",
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

/** Bold "how this order reaches the customer" banner shown near the top of every order email. */
function methodBannerHtml(label: string, collecting: boolean): string {
  return `
    <div style="margin:0 0 22px;padding:12px 16px;border:1.5px solid ${COLORS.navy};border-radius:8px;background:${collecting ? COLORS.cream : COLORS.paper}">
      <div style="font-size:11px;text-transform:uppercase;letter-spacing:0.5px;color:${COLORS.muted};margin-bottom:2px">Delivery method</div>
      <div style="font-size:16px;font-weight:700;color:${COLORS.navy}">${escapeHtml(label)}${collecting ? " — no delivery" : ""}</div>
    </div>`;
}

type OrderDelivery = {
  shippingMethod: string;
  deliveryType?: DeliveryType;
  shippingAddress?: {
    firstName?: string;
    lastName?: string;
    line1: string;
    line2?: string;
    city: string;
    county?: string;
    postcode: string;
    phone?: string;
  };
  collectionPoint?: CollectionPoint;
  collectionContact?: CollectionContact;
};

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

type SendResult = { sent: boolean; error?: string };

/** Best-effort send via Resend's REST API — a failed/unconfigured send must never block order fulfillment. */
async function sendEmail(input: {
  to: string | string[];
  subject: string;
  html: string;
  text: string;
}): Promise<SendResult> {
  const apiKey = resendApiKey.value();
  if (!apiKey) {
    logger.warn("sendEmail: RESEND_API_KEY not configured, skipping", { to: input.to, subject: input.subject });
    return { sent: false, error: "RESEND_API_KEY not configured" };
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
      const body = await res.text().catch(() => "");
      logger.error(`sendEmail: Resend ${res.status}`, { body });
      return { sent: false, error: `Resend ${res.status}: ${body}` };
    }
    return { sent: true };
  } catch (err) {
    logger.error("sendEmail: request failed", err);
    return { sent: false, error: err instanceof Error ? err.message : "Request failed" };
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
  tax: number;
  total: number;
} & OrderDelivery) {
  const itemRows = order.lines
    .map((l) => {
      const base = `${l.quantity} × ${l.name} (${l.colourLabel} / ${l.size}) — ${formatPrice(l.price * l.quantity)}`;
      if (!l.customVerse) return base;
      const noteLine = l.customVerse.note ? ` — Note: ${l.customVerse.note}` : "";
      return `${base}\n  Custom print: "${l.customVerse.text}" — ${l.customVerse.reference}${noteLine}`;
    })
    .join("\n");
  const collecting = isCollectionOrder(order);
  const point = order.collectionPoint ?? COLLECTION_POINT;
  const contact = order.collectionContact;
  const a = order.shippingAddress;
  const addressLine = a ? [a.line1, a.line2, a.city, a.postcode].filter(Boolean).join(", ") : "";
  const orderUrl = `${SITE.url}/account/orders/${order.number}`;

  const fulfilmentBoxHtml = collecting
    ? `
    <div style="margin-top:20px;padding:16px 18px;background:${COLORS.cream};border-radius:8px;border-left:3px solid ${COLORS.navy}">
      <div style="font-size:11px;text-transform:uppercase;letter-spacing:0.5px;color:${COLORS.muted};margin-bottom:4px">Collect your order from</div>
      <div style="font-size:15px;font-weight:700;color:${COLORS.ink}">${escapeHtml(point.address)}</div>
      <div style="font-size:13.5px;color:${COLORS.ink};margin-top:6px"><strong>Collection hours:</strong> ${escapeHtml(point.hours)}</div>
      <div style="font-size:13px;color:${COLORS.muted};margin-top:8px">We&rsquo;ll email you as soon as your order is ready — please wait for that email before coming in. ${escapeHtml(point.instructions)}</div>
      ${contact ? `<div style="font-size:13px;color:${COLORS.muted};margin-top:8px">Collecting: ${escapeHtml(`${contact.firstName} ${contact.lastName}`)} · ${escapeHtml(contact.phone)}</div>` : ""}
    </div>`
    : `
    <div style="margin-top:20px;padding:14px 16px;background:${COLORS.cream};border-radius:8px">
      <div style="font-size:11px;text-transform:uppercase;letter-spacing:0.5px;color:${COLORS.muted};margin-bottom:4px">Delivering to</div>
      <div style="font-size:13.5px;color:${COLORS.ink}">${escapeHtml(addressLine)}</div>
    </div>`;

  const bodyHtml = `
    <h1 style="margin:0 0 6px;font-size:21px;color:${COLORS.ink}">Thanks for your order, ${escapeHtml(order.customerName)}</h1>
    <p style="margin:0 0 20px;font-size:14px;color:${COLORS.muted}">Order <strong style="color:${COLORS.ink}">${order.number}</strong> is confirmed and paid.</p>
    ${methodBannerHtml(order.shippingMethod, collecting)}
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${productRowsHtml(order.lines)}</table>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:18px;font-size:13.5px;color:${COLORS.muted}">
      <tr><td style="padding:3px 0">Subtotal</td><td style="padding:3px 0;text-align:right">${formatPrice(order.subtotal)}</td></tr>
      ${order.discount > 0 ? `<tr><td style="padding:3px 0">Discount</td><td style="padding:3px 0;text-align:right;color:${COLORS.green}">-${formatPrice(order.discount)}</td></tr>` : ""}
      <tr><td style="padding:3px 0">${collecting ? "Collect from store" : `Delivery (${escapeHtml(order.shippingMethod)})`}</td><td style="padding:3px 0;text-align:right">${order.shipping === 0 ? "Free" : formatPrice(order.shipping)}</td></tr>
      ${order.tax > 0 ? `<tr><td style="padding:3px 0">Tax</td><td style="padding:3px 0;text-align:right">${formatPrice(order.tax)}</td></tr>` : ""}
      <tr>
        <td style="padding:10px 0 0;border-top:1px solid ${COLORS.border};font-weight:700;color:${COLORS.ink};font-size:15px">Total paid</td>
        <td style="padding:10px 0 0;border-top:1px solid ${COLORS.border};text-align:right;font-weight:700;color:${COLORS.ink};font-size:15px">${formatPrice(order.total)}</td>
      </tr>
    </table>
    ${fulfilmentBoxHtml}
    ${button(collecting ? "View your order" : "Track your order", orderUrl)}
  `;

  await sendEmail({
    to: order.customerEmail,
    subject: `Order confirmed — ${order.number} — ${SITE.name}`,
    text: [
      `Thanks for your order, ${order.customerName}!`,
      `Order ${order.number} is confirmed and paid.`,
      "",
      `DELIVERY METHOD: ${order.shippingMethod.toUpperCase()}${collecting ? " (no delivery)" : ""}`,
      "",
      "Items:",
      itemRows,
      "",
      `Subtotal: ${formatPrice(order.subtotal)}`,
      order.discount > 0 ? `Discount: -${formatPrice(order.discount)}` : "",
      `${collecting ? "Collect from store" : `Delivery (${order.shippingMethod})`}: ${order.shipping === 0 ? "Free" : formatPrice(order.shipping)}`,
      order.tax > 0 ? `Tax: ${formatPrice(order.tax)}` : "",
      `Total paid: ${formatPrice(order.total)}`,
      "",
      ...(collecting
        ? [
            `Collect your order from: ${point.address}`,
            `Collection hours: ${point.hours}`,
            "We'll email you as soon as your order is ready — please wait for that email before coming in.",
            point.instructions,
            contact ? `Collecting: ${contact.firstName} ${contact.lastName} · ${contact.phone}` : "",
          ]
        : [`Delivering to: ${addressLine}`]),
      "",
      `${collecting ? "View" : "Track"} your order: ${orderUrl}`,
      "",
      `Questions? Reach us at ${SITE.email} or ${SITE.phone}.`,
    ]
      .filter((l) => l !== "")
      .join("\n"),
    html: emailShell({
      previewText: collecting
        ? `Order ${order.number} is confirmed — collect from ${point.address}.`
        : `Order ${order.number} is confirmed — ${formatPrice(order.total)} paid.`,
      bodyHtml,
    }),
  });
}

/**
 * Alerts the store owner that a paid order is waiting, with a link straight
 * to it in the admin dashboard. Sent alongside the customer's confirmation.
 */
export async function sendNewOrderAdminEmail(order: {
  id: string;
  number: string;
  customerEmail: string;
  customerName: string;
  lines: OrderLine[];
  total: number;
} & OrderDelivery) {
  const recipients = adminNotifyEmail
    .value()
    .split(",")
    .map((e) => e.trim())
    .filter(Boolean);
  if (!recipients.length) return;

  const collecting = isCollectionOrder(order);
  const a = order.shippingAddress;
  const c = order.collectionContact;
  // Collection: who's coming in. Delivery: where to post it.
  const contactLines = (
    collecting
      ? [c ? `${c.firstName} ${c.lastName}` : order.customerName, c?.email ?? order.customerEmail]
      : a
        ? [[a.firstName, a.lastName].filter(Boolean).join(" "), a.line1, a.line2, a.city, a.county, a.postcode]
        : []
  ).filter((l): l is string => !!l);
  const contactPhone = collecting ? c?.phone : a?.phone;
  const boxTitle = collecting ? "Customer will collect in store — do not post" : "Ship to";
  const itemCount = order.lines.reduce((n, l) => n + l.quantity, 0);
  const adminUrl = `${SITE.url}/admin/orders/${encodeURIComponent(order.id)}`;
  const hasCustom = order.lines.some((l) => l.customVerse);

  const bodyHtml = `
    <h1 style="margin:0 0 6px;font-size:21px;color:${COLORS.ink}">New ${collecting ? "collection " : ""}order ${escapeHtml(order.number)}</h1>
    <p style="margin:0 0 24px;font-size:14px;color:${COLORS.muted}">
      ${escapeHtml(order.customerName)} (${escapeHtml(order.customerEmail)}) paid <strong style="color:${COLORS.ink}">${formatPrice(order.total)}</strong>
      for ${itemCount} item${itemCount === 1 ? "" : "s"} — ${escapeHtml(order.shippingMethod)}.
      ${hasCustom ? `<br /><strong style="color:${COLORS.ink}">Includes a custom print.</strong>` : ""}
    </p>
    ${methodBannerHtml(order.shippingMethod, collecting)}
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${productRowsHtml(order.lines)}</table>
    <div style="margin-top:20px;padding:14px 16px;background:${COLORS.cream};border-radius:8px">
      <div style="font-size:11px;text-transform:uppercase;letter-spacing:0.5px;color:${COLORS.muted};margin-bottom:4px">${boxTitle}</div>
      <div style="font-size:13.5px;color:${COLORS.ink}">${contactLines.map(escapeHtml).join("<br />")}</div>
      ${contactPhone ? `<div style="font-size:13px;color:${COLORS.muted};margin-top:4px">${escapeHtml(contactPhone)}</div>` : ""}
      ${collecting ? `<div style="font-size:12.5px;color:${COLORS.muted};margin-top:8px">Set the order to &ldquo;Ready for collection&rdquo; in the dashboard when it&rsquo;s ready — that emails the customer to come in.</div>` : ""}
    </div>
    ${button("View order in dashboard", adminUrl)}
  `;

  await sendEmail({
    to: recipients,
    subject: `${collecting ? "[COLLECTION] " : ""}New order ${order.number} — ${formatPrice(order.total)} from ${order.customerName}`,
    text: [
      `New ${collecting ? "collection " : ""}order ${order.number}`,
      `DELIVERY METHOD: ${order.shippingMethod.toUpperCase()}${collecting ? " (no delivery)" : ""}`,
      `${order.customerName} (${order.customerEmail}) paid ${formatPrice(order.total)} — ${order.shippingMethod}.`,
      "",
      "Items:",
      ...order.lines.map((l) => {
        const base = `${l.quantity} × ${l.name}`;
        return l.customVerse
          ? `${base}\n  Custom print: "${l.customVerse.text}" — ${l.customVerse.reference}${l.customVerse.note ? ` — Note: ${l.customVerse.note}` : ""}`
          : base;
      }),
      "",
      `${boxTitle}:`,
      ...contactLines,
      contactPhone ?? "",
      "",
      `View in the admin dashboard: ${adminUrl}`,
    ].join("\n"),
    html: emailShell({
      previewText: `${order.customerName} paid ${formatPrice(order.total)} — order ${order.number}.`,
      bodyHtml,
    }),
  });
}

/**
 * Tells the customer about a refund and/or cancellation — sent by the
 * refundOrder function, so a cancel-with-refund is one email, not two.
 */
export async function sendRefundEmail(order: {
  number: string;
  customerEmail: string;
  customerName: string;
  lines: OrderLine[];
  /** Pence refunded by this action (0 when cancelling an order already refunded). */
  refundAmount: number;
  totalRefunded: number;
  orderTotal: number;
  cancelled: boolean;
}): Promise<SendResult> {
  const refunded = order.refundAmount > 0;
  const heading = order.cancelled
    ? `Order ${order.number} has been cancelled`
    : `We've refunded ${formatPrice(order.refundAmount)} on order ${order.number}`;
  const refundLine = refunded
    ? `We've refunded <strong style="color:${COLORS.ink}">${formatPrice(order.refundAmount)}</strong> to your original payment method. Refunds usually take 5–10 working days to appear, depending on your bank.`
    : order.totalRefunded > 0
      ? `Your payment of ${formatPrice(order.totalRefunded)} has already been refunded to your original payment method.`
      : "";
  const partialNote =
    refunded && order.totalRefunded < order.orderTotal
      ? `So far ${formatPrice(order.totalRefunded)} of your ${formatPrice(order.orderTotal)} order has been refunded.`
      : "";
  const greeting = order.customerName ? `Hi ${order.customerName.split(" ")[0]},` : "Hi,";
  const orderUrl = `${SITE.url}/account/orders/${order.number}`;

  const bodyHtml = `
    <h1 style="margin:0 0 14px;font-size:21px;color:${COLORS.ink}">${escapeHtml(heading)}</h1>
    <p style="margin:0 0 10px;font-size:14px;color:${COLORS.ink}">${escapeHtml(greeting)}</p>
    ${order.cancelled ? `<p style="margin:0 0 10px;font-size:14px;color:${COLORS.muted}">Your order <strong style="color:${COLORS.ink}">${escapeHtml(order.number)}</strong> has been cancelled and won&rsquo;t be sent or made ready for collection.</p>` : ""}
    ${refundLine ? `<p style="margin:0 0 10px;font-size:14px;color:${COLORS.muted}">${refundLine}</p>` : ""}
    ${partialNote ? `<p style="margin:0 0 10px;font-size:14px;color:${COLORS.muted}">${escapeHtml(partialNote)}</p>` : ""}
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:14px">${productRowsHtml(order.lines)}</table>
    <p style="margin:18px 0 0;font-size:13.5px;color:${COLORS.muted}">If you didn&rsquo;t expect this or have any questions, just reply or contact us below.</p>
    ${button("View your order", orderUrl)}
  `;

  return sendEmail({
    to: order.customerEmail,
    subject: order.cancelled
      ? `Order ${order.number} cancelled${refunded ? ` — ${formatPrice(order.refundAmount)} refunded` : ""} — ${SITE.name}`
      : `Refund of ${formatPrice(order.refundAmount)} for order ${order.number} — ${SITE.name}`,
    text: [
      heading,
      "",
      greeting,
      order.cancelled ? `Your order ${order.number} has been cancelled and won't be sent or made ready for collection.` : "",
      refunded
        ? `We've refunded ${formatPrice(order.refundAmount)} to your original payment method. Refunds usually take 5-10 working days to appear, depending on your bank.`
        : order.totalRefunded > 0
          ? `Your payment of ${formatPrice(order.totalRefunded)} has already been refunded to your original payment method.`
          : "",
      partialNote,
      "",
      "Items:",
      ...order.lines.map((l) => `${l.quantity} × ${l.name}`),
      "",
      `View your order: ${orderUrl}`,
      `Questions? Reach us at ${SITE.email} or ${SITE.phone}.`,
    ]
      .filter((l, i, all) => l !== "" || all[i - 1] !== "")
      .join("\n"),
    html: emailShell({ previewText: heading, bodyHtml }),
  });
}
