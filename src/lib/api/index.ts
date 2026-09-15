/**
 * Data-access barrel — the single import surface for storefront data.
 * Firestore-backed (via `firebase-admin`, server-only) except `./checkout`,
 * which only holds shared pricing types/helpers now that checkout itself is
 * a Firebase Cloud Function. Customer-specific data (own orders, addresses,
 * profile) is fetched client-side — see `src/lib/firebase/orders.ts` and
 * `src/lib/firebase/addresses.ts` — since it depends on who's signed in.
 */

export * from "./products";
export * from "./collections";
export * from "./reviews";
export * from "./settings";
export * from "./checkout";
