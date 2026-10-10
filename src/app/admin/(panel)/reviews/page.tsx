"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { EyeIcon, EyeOffIcon } from "lucide-react";
import { adminApi } from "@/lib/admin/client";
import { AdminHeader, Card } from "@/components/admin/ui";
import { RatingStars } from "@/components/common/rating-stars";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate } from "@/lib/format";

export default function AdminReviewsPage() {
  const qc = useQueryClient();
  const { data, isPending } = useQuery({
    queryKey: ["admin", "reviews"],
    queryFn: adminApi.reviews,
  });

  const setPublished = useMutation({
    mutationFn: ({ id, published }: { id: string; published: boolean }) =>
      adminApi.setReviewPublished(id, published),
    onSuccess: (_res, vars) => {
      qc.invalidateQueries({ queryKey: ["admin", "reviews"] });
      toast.success(vars.published ? "Review published" : "Review hidden");
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Couldn't update review"),
  });

  const reviews = data?.reviews ?? [];

  return (
    <>
      <AdminHeader
        title="Reviews"
        description="Hidden reviews — and their photos — don't appear on the storefront. Check photos before publishing."
      />

      {isPending ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {reviews.map((review) => (
            <Card key={review.id}>
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="mb-1 flex flex-wrap items-center gap-2">
                    <RatingStars value={review.rating} size={14} />
                    <span className="text-sm font-medium">{review.title}</span>
                    {review.published ? (
                      <Badge
                        variant="outline"
                        className="bg-emerald-100 text-emerald-900"
                      >
                        Published
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-black/5 text-muted-foreground">
                        Hidden
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{review.body}</p>
                  {review.imagePreviews && review.imagePreviews.some(Boolean) && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {review.imagePreviews.map((url, i) =>
                        url ? (
                          <a
                            key={i}
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block size-20 overflow-hidden rounded-md border border-black/10 bg-[#f1eadb]"
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element -- short-lived signed URL, not worth optimizing */}
                            <img
                              src={url}
                              alt={`Review photo ${i + 1}`}
                              className="size-full object-cover"
                            />
                          </a>
                        ) : null,
                      )}
                    </div>
                  )}
                  <p className="mt-1 text-xs text-muted-foreground">
                    {review.author} · {review.productName} ·{" "}
                    {formatDate(review.createdAt)}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="shrink-0"
                  onClick={() =>
                    setPublished.mutate({
                      id: review.id,
                      published: !review.published,
                    })
                  }
                >
                  {review.published ? (
                    <>
                      <EyeOffIcon className="size-4" /> Hide
                    </>
                  ) : (
                    <>
                      <EyeIcon className="size-4" /> Publish
                    </>
                  )}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
