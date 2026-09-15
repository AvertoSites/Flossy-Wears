import "server-only";

/**
 * Royal Mail Tracking (Server-side) v2 REST API — confirmed against
 * https://developer.royalmail.net (public API listing, no portal login
 * required to see it). Needs a Royal Mail API account; credentials go in
 * `ROYAL_MAIL_TRACKING_CLIENT_ID` / `ROYAL_MAIL_TRACKING_CLIENT_SECRET`.
 *
 * IMPORTANT: verify the exact base URL / header names against your own
 * account's docs page (developer.royalmail.net/tracking) before relying on
 * this in production — the portal's technical reference pages require a
 * logged-in account to view, so this is built from the publicly documented
 * product description plus Royal Mail's well-known IBM API Connect gateway
 * convention (client id/secret headers), not a verified live response.
 */
const BASE_URL = "https://api.royalmail.net/mailpieces/v2";

export type TrackingEvent = {
  eventCode: string;
  eventName: string;
  eventDateTime: string;
  locationName?: string;
};

export async function getRoyalMailTracking(trackingNumber: string): Promise<{
  status: string;
  events: TrackingEvent[];
} | null> {
  const clientId = process.env.ROYAL_MAIL_TRACKING_CLIENT_ID;
  const clientSecret = process.env.ROYAL_MAIL_TRACKING_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error(
      "ROYAL_MAIL_TRACKING_CLIENT_ID / ROYAL_MAIL_TRACKING_CLIENT_SECRET are not configured.",
    );
  }

  const res = await fetch(`${BASE_URL}/${encodeURIComponent(trackingNumber)}/events`, {
    headers: {
      "X-IBM-Client-Id": clientId,
      "X-IBM-Client-Secret": clientSecret,
      accept: "application/json",
    },
    cache: "no-store",
  });

  if (res.status === 404) return null;
  if (!res.ok) {
    throw new Error(`Royal Mail tracking lookup failed (${res.status})`);
  }

  const data = (await res.json()) as {
    mailPieces?: {
      summary?: { statusDescription?: string };
      events?: { eventCode: string; eventName: string; eventDateTime: string; locationName?: string }[];
    };
  };

  const mailPiece = data.mailPieces;
  if (!mailPiece) return null;

  return {
    status: mailPiece.summary?.statusDescription ?? "Unknown",
    events: (mailPiece.events ?? []).map((e) => ({
      eventCode: e.eventCode,
      eventName: e.eventName,
      eventDateTime: e.eventDateTime,
      locationName: e.locationName,
    })),
  };
}

/**
 * NOT WIRED UP. Royal Mail's shipment/label creation product is "Click &
 * Drop", a separate business-contract API whose request/response schema
 * isn't visible without logging into a Royal Mail business account — so
 * this is a placeholder, not a working integration. Once you have Click &
 * Drop portal access (https://www.royalmail.com/business/click-drop),
 * replace this with the real endpoint/payload from your account's API docs.
 */
export async function createRoyalMailShipment(): Promise<never> {
  throw new Error(
    "createRoyalMailShipment is not implemented — see the comment in src/lib/royal-mail/client.ts. " +
      "Needs Royal Mail Click & Drop business-account API access to wire up for real.",
  );
}
