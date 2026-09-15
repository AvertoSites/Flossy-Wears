"use client";

import { addDoc, collection } from "firebase/firestore";
import { firestore } from "@/lib/firebase/client";

export async function submitReview(input: {
  productId: string;
  authorId: string;
  author: string;
  rating: number;
  title: string;
  body: string;
}): Promise<void> {
  await addDoc(collection(firestore, "reviews"), {
    productId: input.productId,
    authorId: input.authorId,
    author: input.author,
    rating: input.rating,
    title: input.title,
    body: input.body,
    createdAt: new Date().toISOString(),
    verified: false,
    published: false, // admin reviews and publishes it — see /admin/reviews
  });
}
