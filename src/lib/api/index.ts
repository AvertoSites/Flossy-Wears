/**
 * Data-access barrel — the single import surface for storefront data.
 *
 * Today these resolve to in-memory mock fixtures. To move to Firebase later,
 * reimplement the modules in this folder (Firestore queries, Firebase Auth,
 * Cloud Functions for checkout) and keep these signatures identical. Pages,
 * loaders and query hooks import only from `@/lib/api`.
 */

export * from "./products";
export * from "./collections";
export * from "./reviews";
export * from "./account";
export * from "./checkout";
