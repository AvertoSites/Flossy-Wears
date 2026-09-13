import { CheckCircle2Icon } from "lucide-react";
import { RatingStars } from "@/components/common/rating-stars";
import { formatDate } from "@/lib/format";
import type { RatingSummary } from "@/lib/api/reviews";
import type { Review } from "@/types";

export function ProductReviews({
  reviews,
  summary,
}: {
  reviews: Review[];
  summary: RatingSummary;
}) {
  const maxCount = Math.max(...summary.distribution, 1);

  return (
    <section id="reviews" className="container-page scroll-mt-24 py-16">
      <div className="grid gap-10 lg:grid-cols-[260px_1fr]">
        <div className="flex flex-col gap-4">
          <h2 className="text-2xl">Reviews</h2>
          <div className="flex items-center gap-3">
            <span className="font-display text-4xl">
              {summary.average.toFixed(1)}
            </span>
            <div className="flex flex-col">
              <RatingStars value={summary.average} size={16} />
              <span className="text-xs text-muted-foreground">
                {summary.total} reviews
              </span>
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            {[5, 4, 3, 2, 1].map((star) => {
              const count = summary.distribution[star - 1];
              return (
                <div key={star} className="flex items-center gap-2 text-xs">
                  <span className="w-8 text-muted-foreground">{star}★</span>
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-cream">
                    <div
                      className="h-full rounded-full bg-gold"
                      style={{ width: `${(count / maxCount) * 100}%` }}
                    />
                  </div>
                  <span className="w-6 text-right text-muted-foreground">
                    {count}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex flex-col divide-y divide-border">
          {reviews.map((review) => (
            <article key={review.id} className="flex flex-col gap-2 py-5 first:pt-0">
              <div className="flex items-center justify-between">
                <RatingStars value={review.rating} size={14} />
                <time className="text-xs text-muted-foreground">
                  {formatDate(review.createdAt)}
                </time>
              </div>
              <h3 className="text-sm font-medium">{review.title}</h3>
              <p className="text-sm text-muted-foreground">{review.body}</p>
              <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                {review.author}
                {review.verified && (
                  <span className="inline-flex items-center gap-1 text-gold-dark">
                    <CheckCircle2Icon className="size-3.5" />
                    Verified buyer
                  </span>
                )}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
