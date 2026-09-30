import { HttpsError } from "firebase-functions/v2/https";
import type { Address } from "./types";

/**
 * Server-side mirror of the checks in `src/lib/validations/uk-address.ts` —
 * the functions codebase can't import across the `functions/` boundary, so
 * keep the two in sync. The form already enforces these; this stops a
 * hand-edited Firestore doc or an address saved before UK validation existed
 * from reaching a Royal Mail label.
 */
const UK_POSTCODE =
  /^(GIR0AA|(?:[A-PR-UWYZ]\d{1,2}|[A-PR-UWYZ][A-HK-Y]\d{1,2}|[A-PR-UWYZ]\d[A-HJKPSTUW]|[A-PR-UWYZ][A-HK-Y]\d[ABEHMNPRVWXY])\d[ABD-HJLNP-UW-Z]{2})$/;

const NON_UK_POSTCODE_AREAS = ["GY", "JE", "IM", "BF"];

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

export function assertUkDeliveryAddress(address: Address): void {
  const postcode = (address.postcode ?? "").replace(/\s+/g, "").toUpperCase();
  const area = postcode.match(/^[A-Z]+/)?.[0] ?? "";
  const ok =
    UK_COUNTRY_ALIASES.has((address.country ?? "").trim().toLowerCase()) &&
    UK_POSTCODE.test(postcode) &&
    !NON_UK_POSTCODE_AREAS.includes(area) &&
    !!address.line1?.trim() &&
    !!address.city?.trim();
  if (!ok) {
    throw new HttpsError(
      "invalid-argument",
      "We only deliver to UK addresses — please update your delivery address with a valid UK postcode.",
    );
  }
}
