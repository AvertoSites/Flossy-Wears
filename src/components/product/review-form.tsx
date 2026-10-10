"use client";

import { useEffect, useRef, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ImagePlusIcon, Loader2Icon, XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/common/text-field";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/store/auth";
import { submitReview } from "@/lib/firebase/reviews";
import {
  compressReviewImage,
  MAX_REVIEW_IMAGES,
  type CompressedImage,
} from "@/lib/firebase/storage";

type PickedImage = CompressedImage & { key: string; previewUrl: string };

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
  const [images, setImages] = useState<PickedImage[]>([]);
  const [processing, setProcessing] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
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

  // Free the preview blob URLs when the form goes away.
  const imagesRef = useRef(images);
  useEffect(() => {
    imagesRef.current = images;
  }, [images]);
  useEffect(
    () => () => imagesRef.current.forEach((img) => URL.revokeObjectURL(img.previewUrl)),
    [],
  );

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

  async function onFilesSelected(files: FileList | null) {
    if (!files || files.length === 0) return;
    setImageError(null);
    const room = MAX_REVIEW_IMAGES - images.length;
    const picked = Array.from(files).slice(0, room);
    const errors: string[] = [];
    if (files.length > room) {
      errors.push(`You can add up to ${MAX_REVIEW_IMAGES} photos.`);
    }

    setProcessing(true);
    try {
      const results = await Promise.allSettled(picked.map(compressReviewImage));
      const added: PickedImage[] = [];
      results.forEach((r) => {
        if (r.status === "fulfilled") {
          added.push({
            ...r.value,
            key: crypto.randomUUID(),
            previewUrl: URL.createObjectURL(r.value.blob),
          });
        } else {
          errors.push((r.reason as Error).message);
        }
      });
      setImages((prev) => [...prev, ...added]);
      if (errors.length > 0) setImageError(errors.join(" "));
    } finally {
      setProcessing(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  function removeImage(key: string) {
    setImages((prev) => {
      const target = prev.find((img) => img.key === key);
      if (target) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((img) => img.key !== key);
    });
  }

  async function onSubmit(values: ReviewValues) {
    setSubmitError(null);
    try {
      await submitReview({
        productId,
        authorId: user!.uid,
        author: `${user!.firstName} ${user!.lastName[0] ?? ""}.`.trim(),
        rating: values.rating,
        title: values.title,
        body: values.body,
        images,
      });
      setSubmitted(true);
    } catch (error) {
      setSubmitError(
        error instanceof Error && error.message
          ? error.message
          : "Something went wrong submitting your review — please try again.",
      );
    }
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
      <div className="flex flex-col gap-2">
        <Label>
          Photos{" "}
          <span className="font-normal text-muted-foreground">
            (optional, up to {MAX_REVIEW_IMAGES})
          </span>
        </Label>
        <div className="flex flex-wrap gap-3">
          {images.map((img, i) => (
            <div
              key={img.key}
              className="relative size-20 overflow-hidden rounded-md border border-border bg-cream"
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- local blob: preview */}
              <img
                src={img.previewUrl}
                alt={`Photo ${i + 1}`}
                className="size-full object-cover"
              />
              <button
                type="button"
                onClick={() => removeImage(img.key)}
                disabled={isSubmitting}
                className="absolute top-1 right-1 rounded-full bg-black/60 p-0.5 text-white hover:bg-black/80"
                aria-label={`Remove photo ${i + 1}`}
              >
                <XIcon className="size-3.5" />
              </button>
            </div>
          ))}
          {images.length < MAX_REVIEW_IMAGES && (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={processing || isSubmitting}
              className="flex size-20 flex-col items-center justify-center gap-1 rounded-md border border-dashed border-input text-xs text-muted-foreground hover:bg-cream disabled:opacity-60"
            >
              {processing ? (
                <Loader2Icon className="size-5 animate-spin" />
              ) : (
                <>
                  <ImagePlusIcon className="size-5" />
                  Add photo
                </>
              )}
            </button>
          )}
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => onFilesSelected(e.target.files)}
        />
        {imageError && <p className="text-xs text-destructive">{imageError}</p>}
      </div>
      {submitError && <p className="text-sm text-destructive">{submitError}</p>}
      <div className="flex gap-3">
        <Button type="submit" disabled={isSubmitting || processing}>
          {isSubmitting ? "Submitting…" : "Submit review"}
        </Button>
        <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
