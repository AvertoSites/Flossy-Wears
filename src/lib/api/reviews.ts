import "server-only";

import { adminDb } from "@/lib/firebase/admin";
import type { Review } from "@/types";

export type RatingSummary = {
  average: number;
  total: number;
  /** Count per star, index 0 = 1 star .. index 4 = 5 stars. */
  distribution: number[];
};

async function getPublishedReviews(productId: string): Promise<Review[]> {
  const snap = await adminDb
    .collection("reviews")
    .where("productId", "==", productId)
    .where("published", "==", true)
    .get();
  return snap.docs.map((d) => d.data() as Review);
}

export async function getReviews(productId: string): Promise<Review[]> {
  const list = await getPublishedReviews(productId);
  return list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

/** Real average/count/distribution computed from published reviews — no fallback needed. */
export async function getRatingSummary(productId: string): Promise<RatingSummary> {
  const list = await getPublishedReviews(productId);
  const distribution = [0, 0, 0, 0, 0];
  list.forEach((r) => {
    const idx = Math.min(4, Math.max(0, Math.round(r.rating) - 1));
    distribution[idx] += 1;
  });
  const total = list.length;
  const average = total
    ? list.reduce((sum, r) => sum + r.rating, 0) / total
    : 0;
  return { average, total, distribution };
}
