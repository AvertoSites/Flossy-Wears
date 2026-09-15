"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

type WishlistState = {
  slugs: string[];
  hydrated: boolean;
  toggle: (slug: string) => void;
  has: (slug: string) => boolean;
  clear: () => void;
  /** Bulk-replace, used by WishlistSync when merging with the signed-in user's remote list. */
  setAll: (slugs: string[]) => void;
};

export const useWishlist = create<WishlistState>()(
  persist(
    (set, get) => ({
      slugs: [],
      hydrated: false,
      toggle: (slug) =>
        set((state) => ({
          slugs: state.slugs.includes(slug)
            ? state.slugs.filter((s) => s !== slug)
            : [slug, ...state.slugs],
        })),
      has: (slug) => get().slugs.includes(slug),
      clear: () => set({ slugs: [] }),
      setAll: (slugs) => set({ slugs }),
    }),
    {
      name: "flossywears-wishlist",
      partialize: (state) => ({ slugs: state.slugs }),
      onRehydrateStorage: () => (state) => {
        if (state) state.hydrated = true;
      },
    },
  ),
);
