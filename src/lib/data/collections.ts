import type { Collection } from "@/types";

export const collections: Collection[] = [
  {
    id: "col_the_four",
    slug: "the-four",
    name: "The Four",
    eyebrow: "The October 2026 drop",
    description:
      "Four verses, four colourways, one statement. Our signature heavyweight crewnecks — Hope, Faith, Her and Believes — photographed for the cover and made to be lived in.",
    heroImage: "/image/four-campaign-cover.jpeg",
    featured: true,
  },
  {
    id: "col_for_her",
    slug: "for-her",
    name: "For Her",
    eyebrow: "Worn by women of faith",
    description:
      "Scripture cut for her. Relaxed shoulders, softened fleece and prints that speak before you do.",
    heroImage: "/image/four-god-within-her-women-olive-campaign.jpeg",
    featured: true,
  },
  {
    id: "col_for_him",
    slug: "for-him",
    name: "For Him",
    eyebrow: "Quiet confidence",
    description:
      "Understated faithwear for him — heavyweight cotton, boxy fit, verses that carry weight.",
    heroImage: "/image/four-faith-men-brown.jpeg",
    featured: true,
  },
  {
    id: "col_new_arrivals",
    slug: "new-arrivals",
    name: "New Arrivals",
    eyebrow: "Fresh off the press",
    description: "The latest additions to the Flossy Wears line.",
    heroImage: "/image/four-hope-men-grey.jpeg",
    featured: false,
  },
  {
    id: "col_sale",
    slug: "sale",
    name: "Sale",
    eyebrow: "Last chance",
    description: "Previous drops and end-of-line colourways, while stock lasts.",
    heroImage: "/image/four-believes-women-purple-blonde.jpeg",
    featured: false,
  },
];

export function getCollectionBySlug(slug: string): Collection | undefined {
  return collections.find((c) => c.slug === slug);
}
