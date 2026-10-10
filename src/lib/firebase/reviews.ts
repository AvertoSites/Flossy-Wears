"use client";

import { collection, doc, setDoc } from "firebase/firestore";
import { firestore } from "@/lib/firebase/client";
import { uploadReviewImage, type CompressedImage } from "@/lib/firebase/storage";
import type { ReviewImage } from "@/types";

export async function submitReview(input: {
  productId: string;
  authorId: string;
  author: string;
  rating: number;
  title: string;
  body: string;
  images?: CompressedImage[];
}): Promise<void> {
  // Allocate the id up front so photos can be uploaded under
  // review-images/{uid}/{reviewId}/ before the doc that references them exists.
  const reviewRef = doc(collection(firestore, "reviews"));

  const images: ReviewImage[] = await Promise.all(
    (input.images ?? []).map(async (image, i) => ({
      path: await uploadReviewImage(input.authorId, reviewRef.id, i, image),
      width: image.width,
      height: image.height,
    })),
  );

  await setDoc(reviewRef, {
    id: reviewRef.id,
    productId: input.productId,
    authorId: input.authorId,
    author: input.author,
    rating: input.rating,
    title: input.title,
    body: input.body,
    ...(images.length > 0 && { images }),
    createdAt: new Date().toISOString(),
    verified: false,
    published: false, // admin reviews and publishes it — see /admin/reviews
  });
}
