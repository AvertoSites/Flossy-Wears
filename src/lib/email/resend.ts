import "server-only";

import { site } from "@/lib/data/site";

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

const STATUS_COPY: Record<string, string> = {
  processing: "is being processed",
  packed: "has been packed and is ready to ship",
  shipped: "is on its way",
  delivered: "has been delivered",
  cancelled: "has been cancelled",
};

export async function sendTrackingUpdateEmail(input: {
  to: string;
  orderNumber: string;
  status: string;
  carrier?: string;
  trackingNumber?: string;
  trackingUrl?: string;
}): Promise<{ sent: boolean; error?: string }> {
  const trackLink = `${site.url}/track?order=${encodeURIComponent(input.orderNumber)}`;
  const statusLine = STATUS_COPY[input.status] ?? `is now ${input.status}`;
  const courierLine =
    input.carrier && input.trackingNumber
      ? `Carrier: ${input.carrier} · Tracking number: ${input.trackingNumber}`
      : "";

  return sendEmail({
    to: input.to,
    subject: `Order ${input.orderNumber} update — ${site.name}`,
    text: [
      `Your order ${input.orderNumber} ${statusLine}.`,
      courierLine,
      `Track your order: ${input.trackingUrl ?? trackLink}`,
    ]
      .filter(Boolean)
      .join("\n"),
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto">
        <h2>Order ${input.orderNumber} update</h2>
        <p>Your order ${statusLine}.</p>
        ${courierLine ? `<p>${courierLine}</p>` : ""}
        <p><a href="${input.trackingUrl ?? trackLink}">Track your order</a></p>
        <p style="color:#666;font-size:13px">${site.name}</p>
      </div>
    `,
  });
}
