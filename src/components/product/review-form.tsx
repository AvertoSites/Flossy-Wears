"use client";

import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/common/text-field";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/store/auth";
import { submitReview } from "@/lib/firebase/reviews";

const reviewSchema = z.object({
  rating: z.number().min(1).max(5),
  title: z.string().min(1, "Give your review a short title"),
  body: z.string().min(10, "Please add a little more detail"),
});
type ReviewValues = z.infer<typeof reviewSchema>;

export function ReviewForm({ productId }: { productId: string }) {
  const user = useAuth((s) => s.user);
  const status = useAuth((s) => s.status);
  const [open, setOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const {
    register,
    handleSubmit,
    setValue,
    control,
    formState: { errors, isSubmitting },
  } = useForm<ReviewValues>({
    resolver: zodResolver(reviewSchema),
    defaultValues: { rating: 5, title: "", body: "" },
  });
  const rating = useWatch({ control, name: "rating" });

  if (status !== "signed-in" || !user) return null;

  if (submitted) {
    return (
      <p className="rounded-md bg-cream px-4 py-3 text-sm text-gold-dark">
        Thanks — your review is in and will appear once it&rsquo;s approved.
      </p>
    );
  }

  if (!open) {
    return (
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        Write a review
      </Button>
    );
  }

  async function onSubmit(values: ReviewValues) {
    await submitReview({
      productId,
      authorId: user!.uid,
      author: `${user!.firstName} ${user!.lastName[0] ?? ""}.`.trim(),
      rating: values.rating,
      title: values.title,
      body: values.body,
    });
    setSubmitted(true);
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="flex flex-col gap-4 rounded-xl border border-border bg-card p-5"
      noValidate
    >
      <div>
        <Label className="mb-2 block">Your rating</Label>
        <RadioGroup
          value={String(rating)}
          onValueChange={(v) => setValue("rating", Number(v))}
          className="flex gap-3"
        >
          {[1, 2, 3, 4, 5].map((n) => (
            <Label
              key={n}
              htmlFor={`rating-${n}`}
              className="flex cursor-pointer items-center gap-1.5 text-sm"
            >
              <RadioGroupItem id={`rating-${n}`} value={String(n)} />
              {n}
            </Label>
          ))}
        </RadioGroup>
      </div>
      <TextField label="Title" error={errors.title} {...register("title")} />
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="review-body">Your review</Label>
        <textarea
          id="review-body"
          rows={4}
          className="rounded-md border border-input bg-transparent px-3 py-2 text-sm"
          {...register("body")}
        />
        {errors.body?.message && (
          <p className="text-xs text-destructive">{errors.body.message}</p>
        )}
      </div>
      <div className="flex gap-3">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Submitting…" : "Submit review"}
        </Button>
        <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
