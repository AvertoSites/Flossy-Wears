/**
 * UK delivery-address rules. Pure functions so the same checks can run in the
 * address form (via zod) and be mirrored server-side in
 * `functions/src/uk-address.ts` (separate TS project — keep the two in sync).
 */

/**
 * Full UK postcode format (outward + inward code), per the Royal Mail PAF
 * letter rules:
 * - 1st letter never Q, V, X · 2nd letter never I, J, Z
 * - A9A outward codes only use A B C D E F G H J K P S T U W
 * - AA9A outward codes only use A B E H M N P R V W X Y
 * - inward letters never C I K M O V
 * Plus the special Girobank postcode GIR 0AA.
 * Expects the compact, upper-cased form (see `compactPostcode`).
 */
const UK_POSTCODE =
  /^(GIR0AA|(?:[A-PR-UWYZ]\d{1,2}|[A-PR-UWYZ][A-HK-Y]\d{1,2}|[A-PR-UWYZ]\d[A-HJKPSTUW]|[A-PR-UWYZ][A-HK-Y]\d[ABEHMNPRVWXY])\d[ABD-HJLNP-UW-Z]{2})$/;

/**
 * Postcode areas that are Crown Dependencies or forces mail rather than the UK
 * itself — Royal Mail parcels there need customs paperwork (Channel Islands)
 * or a different service (BFPO), so they're not deliverable on our UK rates.
 */
export const NON_UK_POSTCODE_AREAS = ["GY", "JE", "IM", "BF"] as const;

/** Names customers commonly type for the UK — all stored as "United Kingdom". */
const UK_COUNTRY_ALIASES = new Set([
  "united kingdom",
  "uk",
  "u.k.",
  "gb",
  "great britain",
  "britain",
  "england",
  "scotland",
  "wales",
  "northern ireland",
]);

export const UK_COUNTRY = "United Kingdom";

/** "sw1a 1aa " → "SW1A1AA". */
export function compactPostcode(value: string): string {
  return value.replace(/\s+/g, "").toUpperCase();
}

/** "sw1a1aa" → "SW1A 1AA" — the inward code is always the last 3 characters. */
export function formatUkPostcode(value: string): string {
  const compact = compactPostcode(value);
  return compact.length > 3 ? `${compact.slice(0, -3)} ${compact.slice(-3)}` : compact;
}

export function isValidUkPostcode(value: string): boolean {
  return UK_POSTCODE.test(compactPostcode(value));
}

/** The leading letters of the outward code, e.g. "SW" for "SW1A 1AA", "B" for "B1 1AA". */
export function postcodeArea(value: string): string {
  return compactPostcode(value).match(/^[A-Z]+/)?.[0] ?? "";
}

/** True if the postcode is in the UK proper (not Channel Islands / Isle of Man / BFPO). */
export function isDeliverableUkPostcode(value: string): boolean {
  const area = postcodeArea(value);
  return !(NON_UK_POSTCODE_AREAS as readonly string[]).includes(area);
}

export function isUkCountry(value: string): boolean {
  return UK_COUNTRY_ALIASES.has(value.trim().toLowerCase());
}

/** Strips spaces, dashes, brackets and a "(0)" trunk prefix: "+44 (0)7700 900-123" → "+447700900123". */
export function compactUkPhone(value: string): string {
  return value.replace(/\(0\)/g, "").replace(/[\s()-]/g, "");
}

/**
 * UK numbers: 0 + 9–10 digits nationally, or +44 / 0044 + 9–10 digits (no
 * leading 0) internationally. Covers landlines (01/02/03) and mobiles (07).
 */
export function isValidUkPhone(value: string): boolean {
  return /^(?:0|\+44|0044)[1-9]\d{8,9}$/.test(compactUkPhone(value));
}

/** Normalises to the national format Royal Mail labels expect: "+447700900123" → "07700900123". */
export function formatUkPhone(value: string): string {
  return compactUkPhone(value).replace(/^(?:\+44|0044)/, "0");
}

export type PostcodeLookupResult = "valid" | "not-found" | "unavailable";

/**
 * Checks the postcode actually exists (not just that it's well-formed) against
 * postcodes.io — a free, keyless API over the ONS Postcode Directory. Returns
 * "unavailable" on any network/API failure so a lookup outage never blocks a
 * customer whose postcode already passed the format check.
 */
export async function lookupUkPostcode(
  value: string,
  signal?: AbortSignal,
): Promise<PostcodeLookupResult> {
  try {
    const res = await fetch(
      `https://api.postcodes.io/postcodes/${encodeURIComponent(compactPostcode(value))}/validate`,
      { signal },
    );
    if (!res.ok) return "unavailable";
    const data = (await res.json()) as { result?: boolean };
    return data.result === true ? "valid" : data.result === false ? "not-found" : "unavailable";
  } catch {
    return "unavailable";
  }
}
