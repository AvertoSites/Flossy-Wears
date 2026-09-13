import { getReviewsForProduct } from "@/lib/data/reviews";
import type { Review } from "@/types";

export type RatingSummary = {
  average: number;
  total: number;
  /** Count per star, index 0 = 1 star .. index 4 = 5 stars. */
  distribution: number[];
};

export async function getReviews(productId: string): Promise<Review[]> {
  return [...getReviewsForProduct(productId)].sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt),
  );
}

export async function getRatingSummary(
  productId: string,
  fallback: { average: number; total: number },
): Promise<RatingSummary> {
  const list = getReviewsForProduct(productId);
  const distribution = [0, 0, 0, 0, 0];
  list.forEach((r) => {
    const idx = Math.min(4, Math.max(0, Math.round(r.rating) - 1));
    distribution[idx] += 1;
  });
  return {
    average: fallback.average,
    total: fallback.total,
    distribution,
  };
}
