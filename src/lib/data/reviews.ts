import type { Review } from "@/types";
import { products } from "@/lib/data/products";

const SNIPPETS: Omit<Review, "id" | "productId">[] = [
  {
    author: "Grace A.",
    rating: 5,
    title: "Wear it every week",
    body: "The weight of this fleece is unreal. Washes beautifully and the print hasn't cracked. Gets comments at church every single time.",
    createdAt: "2026-08-21",
    verified: true,
  },
  {
    author: "Daniel O.",
    rating: 5,
    title: "Quietly bold",
    body: "Exactly the vibe I wanted — the message is there without shouting. Fit is boxy, I took my normal size.",
    createdAt: "2026-08-14",
    verified: true,
  },
  {
    author: "Ruth M.",
    rating: 4,
    title: "Lovely, runs large",
    body: "Beautiful colour and so soft. I'm between sizes and should have sized down. Still living in it though.",
    createdAt: "2026-07-30",
    verified: true,
  },
  {
    author: "Samuel K.",
    rating: 5,
    title: "Bought three",
    body: "First one arrived, ordered two more the same day. Delivery was quick and the packaging felt premium.",
    createdAt: "2026-07-11",
    verified: true,
  },
  {
    author: "Esther B.",
    rating: 5,
    title: "My favourite piece",
    body: "The scripture is a daily reminder and a conversation starter. Thank you for making faithwear that actually looks good.",
    createdAt: "2026-06-28",
    verified: false,
  },
  {
    author: "Josh T.",
    rating: 4,
    title: "Great, wanted more colours",
    body: "Really well made. Would love this design in navy. Sizing was spot on for me.",
    createdAt: "2026-06-05",
    verified: true,
  },
];

export const reviews: Review[] = products.flatMap((product, pi) => {
  const count = 3 + (pi % 3);
  return Array.from({ length: count }).map((_, ri) => {
    const snippet = SNIPPETS[(pi + ri) % SNIPPETS.length];
    return {
      ...snippet,
      id: `rev_${product.id}_${ri + 1}`,
      productId: product.id,
    };
  });
});

export function getReviewsForProduct(productId: string): Review[] {
  return reviews.filter((r) => r.productId === productId);
}
