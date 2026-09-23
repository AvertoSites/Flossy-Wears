import "server-only";

import { site } from "@/lib/data/site";
import type { OrderLine } from "@/types";

// Matches src/app/globals.css `--brand-*` tokens.
const COLORS = {
  navy: "#1e3a5f",
  gold: "#c8a44d",
  paper: "#fcfaf5",
  cream: "#f1eadb",
  ink: "#1f1b16",
  muted: "#6b675f",
  border: "#e5ddc8",
  green: "#2f6f3e",
  red: "#a33d3d",
};

const STATUS_COPY: Record<string, string> = {
  processing: "is being processed",
  packed: "has been packed and is ready to ship",
  shipped: "is on its way",
  delivered: "has been delivered",
  cancelled: "has been cancelled",
};

const STATUS_BADGE: Record<string, { bg: string; fg: string; label: string }> = {
  processing: { bg: "#eef2f6", fg: COLORS.navy, label: "Processing" },
  packed: { bg: "#faf3e2", fg: "#9a7b2e", label: "Packed" },
  shipped: { bg: COLORS.navy, fg: COLORS.paper, label: "Shipped" },
  delivered: { bg: "#e7f3ea", fg: COLORS.green, label: "Delivered" },
  cancelled: { bg: "#f8e9e9", fg: COLORS.red, label: "Cancelled" },
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
            <span style="color:${COLORS.paper};font-size:18px;letter-spacing:4px;font-weight:700;text-transform:uppercase">${escapeHtml(site.name)}</span>
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
              Questions? Reach us at <a href="mailto:${site.email}" style="color:${COLORS.navy}">${site.email}</a> or ${site.phone}
            </p>
            <p style="margin:0;color:${COLORS.muted};font-size:12px;text-align:center">${escapeHtml(site.name)} · ${escapeHtml(site.tagline)}</p>
          </td>
        </tr>
      </table>
    </div>
  </body>
</html>`;
}

/**
 * Minimal Resend REST client — no SDK dependency, just `fetch`. Gated behind
 * `RESEND_API_KEY`; every caller must treat a failed/skipped send as
 * non-fatal (an admin updating an order shouldn't be blocked by email being
 * unconfigured or down).
 */
async function sendEmail(input: {
  to: string;
  subject: string;
  html: string;
  text: string;
}): Promise<{ sent: boolean; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return { sent: false, error: "RESEND_API_KEY not configured" };

  const from = process.env.RESEND_FROM_EMAIL || "Flossy Wears <onboarding@resend.dev>";

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        authorization: `Bearer ${apiKey}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({ from, to: input.to, subject: input.subject, html: input.html, text: input.text }),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      return { sent: false, error: `Resend ${res.status}: ${body}` };
    }
    return { sent: true };
  } catch (err) {
    return { sent: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}

export async function sendTrackingUpdateEmail(input: {
  to: string;
  orderNumber: string;
  status: string;
  carrier?: string;
  trackingNumber?: string;
  trackingUrl?: string;
  lines?: OrderLine[];
}): Promise<{ sent: boolean; error?: string }> {
  const trackLink = `${site.url}/track?order=${encodeURIComponent(input.orderNumber)}`;
  const trackHref = input.trackingUrl ?? trackLink;
  const statusLine = STATUS_COPY[input.status] ?? `is now ${input.status}`;
  const courierLine = [
    input.carrier ? `Carrier: ${input.carrier}` : "",
    input.trackingNumber ? `Tracking number: ${input.trackingNumber}` : "",
  ]
    .filter(Boolean)
    .join(" · ");
  const badge = STATUS_BADGE[input.status] ?? { bg: COLORS.cream, fg: COLORS.ink, label: input.status };
  const lines = input.lines ?? [];

  const bodyHtml = `
    <div style="text-align:center;margin-bottom:22px">
      <span style="display:inline-block;background:${badge.bg};color:${badge.fg};font-size:12px;font-weight:700;letter-spacing:0.5px;text-transform:uppercase;padding:6px 14px;border-radius:999px">${escapeHtml(badge.label)}</span>
    </div>
    <h1 style="margin:0 0 6px;font-size:20px;color:${COLORS.ink};text-align:center">Order ${input.orderNumber} ${statusLine}</h1>
    ${
      courierLine
        ? `<p style="margin:8px 0 0;font-size:13.5px;color:${COLORS.muted};text-align:center">${escapeHtml(courierLine)}</p>`
        : ""
    }
    ${
      lines.length > 0
        ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:26px">${productRowsHtml(lines)}</table>`
        : ""
    }
    ${button("Track your order", trackHref)}
  `;

  return sendEmail({
    to: input.to,
    subject: `Order ${input.orderNumber} update — ${site.name}`,
    text: [
      `Your order ${input.orderNumber} ${statusLine}.`,
      courierLine,
      lines.length > 0
        ? [
            "",
            "Items:",
            ...lines.map((l) => `${l.quantity} × ${l.name} (${l.colourLabel} / ${l.size})`),
          ].join("\n")
        : "",
      `Track your order: ${trackHref}`,
    ]
      .filter(Boolean)
      .join("\n"),
    html: emailShell({
      previewText: `Order ${input.orderNumber} ${statusLine}.`,
      bodyHtml,
    }),
  });
}
