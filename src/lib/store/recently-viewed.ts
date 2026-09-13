"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

const MAX = 8;

type RecentlyViewedState = {
  slugs: string[];
  add: (slug: string) => void;
};

export const useRecentlyViewed = create<RecentlyViewedState>()(
  persist(
    (set) => ({
      slugs: [],
      add: (slug) =>
        set((state) => ({
          slugs: [slug, ...state.slugs.filter((s) => s !== slug)].slice(0, MAX),
        })),
    }),
    { name: "flossywears-recently-viewed" },
  ),
);
