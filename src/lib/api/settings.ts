import "server-only";

import { unstable_cache } from "next/cache";
import { adminDb } from "@/lib/firebase/admin";
import type { StoreSettings } from "@/types";

/**
 * Real storefront-wide settings, backing checkout/shipping copy that used to
 * read the hardcoded `SHIPPING_METHODS` constant regardless of what the
 * admin Settings page showed. Admin edits
 * call `revalidateTag("settings")` (see `/api/admin/settings`) to bust this.
 */
export const getStoreSettings = unstable_cache(
  async (): Promise<StoreSettings> => {
    const snap = await adminDb.collection("settings").doc("store").get();
    if (!snap.exists) {
      throw new Error(
        "settings/store is missing — run `npm run seed` after deploying Firestore rules.",
      );
    }
    return snap.data() as StoreSettings;
  },
  ["settings:store"],
  { revalidate: 60, tags: ["settings"] },
);
