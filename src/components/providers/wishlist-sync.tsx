"use client";

import { useEffect, useRef } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { firestore } from "@/lib/firebase/client";
import { useAuth } from "@/lib/store/auth";
import { useWishlist } from "@/lib/store/wishlist";

/**
 * Mirrors the wishlist to `users/{uid}.wishlist` for signed-in customers, so
 * it's not purely per-browser — while still working local-only when signed
 * out (unchanged). Mounted once in providers.tsx alongside AuthListener.
 *
 * Only syncs once the `users/{uid}` profile doc actually exists — it's
 * created by `createCustomerProfile` during sign-up, but that write can
 * still be in flight the moment this mounts (auth state flips before the
 * rest of the register handler finishes). Writing a bare `{wishlist: [...]}`
 * before then would either fail firestore.rules' create check (no `role`
 * field) or create a malformed profile doc — so this just skips syncing
 * until the doc is there, rather than racing it.
 */
export function WishlistSync() {
  const uid = useAuth((s) => s.user?.uid);
  const hydrated = useWishlist((s) => s.hydrated);
  const slugs = useWishlist((s) => s.slugs);
  const setAll = useWishlist((s) => s.setAll);
  const mergedForUid = useRef<string | null>(null);

  // One-time merge of remote + local lists once a user's profile doc exists.
  useEffect(() => {
    if (!uid || !hydrated || mergedForUid.current === uid) return;
    (async () => {
      try {
        const ref = doc(firestore, "users", uid);
        const snap = await getDoc(ref);
        if (!snap.exists()) return; // retry on the next render (e.g. once sign-up finishes writing it)
        mergedForUid.current = uid;
        const remote = (snap.data()?.wishlist as string[] | undefined) ?? [];
        const merged = Array.from(new Set([...remote, ...slugs]));
        setAll(merged);
        await setDoc(ref, { wishlist: merged }, { merge: true });
      } catch {
        // Non-critical background sync — fine to just skip this attempt.
      }
    })();
  }, [uid, hydrated, slugs, setAll]);

  // Push subsequent local changes to Firestore while signed in.
  useEffect(() => {
    if (!uid || mergedForUid.current !== uid) return;
    setDoc(doc(firestore, "users", uid), { wishlist: slugs }, { merge: true }).catch(() => {});
  }, [uid, slugs]);

  return null;
}
