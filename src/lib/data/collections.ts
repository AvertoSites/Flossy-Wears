import type { Collection } from "@/types";

export const collections: Collection[] = [
  {
    id: "col_the_four",
    slug: "the-four",
    name: "The Four",
    eyebrow: "The October 2026 drop",
    description:
      "Four verses, four colourways, one statement. Our signature heavyweight crewnecks — Hope, Faith, Her and Believes — photographed for the cover and made to be lived in.",
    heroImage: "/image/campaign/four-campaign-cover.jpeg",
    featured: true,
  },
  {
    id: "col_for_her",
    slug: "for-her",
    name: "For Her",
    eyebrow: "Worn by women of faith",
    description:
      "Scripture cut for her. Relaxed shoulders, softened fleece and prints that speak before you do.",
    heroImage: "/image/god-within-her/four-god-within-her-women-olive-campaign.jpeg",
    featured: true,
  },
  {
    id: "col_for_him",
    slug: "for-him",
    name: "For Him",
    eyebrow: "Quiet confidence",
    description:
      "Understated faithwear for him — heavyweight cotton, boxy fit, verses that carry weight.",
    heroImage: "/image/faith/four-faith-men-brown.jpeg",
    featured: true,
  },
  {
    id: "col_african_prints",
    slug: "african-prints",
    name: "African Heritage Prints",
    eyebrow: "African print hoodies",
    description:
      "The continent, worn close to the heart. Heavyweight hoodies finished with an Africa appliqué in vibrant wax-print fabric — a celebration of heritage, stitched with pride.",
    heroImage: "/image/african-print-hoodies/patchwork-africa-hoodie-women-yellow.jpeg",
    featured: true,
  },
  {
    id: "col_hoodie_dresses",
    slug: "hoodie-dresses",
    name: "Hooded Maxi Dresses",
    eyebrow: "Modest, relaxed, refined",
    description:
      "Floor-length elegance with the comfort of your favourite hoodie. Soft brushed fleece, a flowing A-line silhouette, side pockets and a contrast drawstring hood — effortless from the office to the weekend.",
    heroImage: "/image/hoodie-dresses/hooded-maxi-dress-black-studio.jpeg",
    featured: true,
  },
  {
    id: "col_christmas_jumpers",
    slug: "christmas-jumpers",
    name: "The Christmas Edit",
    eyebrow: "Jesus is the reason for the season",
    description:
      "Festive jumpers that keep Christ at the centre of Christmas. Cosy crewnecks in seasonal red and winter white, made for carol services, family gatherings and thoughtful gifting.",
    heroImage: "/image/christmas-jumpers/reason-for-the-season-jumper-women-red.jpeg",
    featured: true,
  },
  {
    id: "col_new_arrivals",
    slug: "new-arrivals",
    name: "New Arrivals",
    eyebrow: "Fresh off the press",
    description: "The latest additions to the Flossy Wears line.",
    heroImage: "/image/hope/four-hope-men-grey.jpeg",
    featured: false,
  },
  {
    id: "col_sale",
    slug: "sale",
    name: "Sale",
    eyebrow: "Last chance",
    description: "Previous drops and end-of-line colourways, while stock lasts.",
    heroImage: "/image/believes/four-believes-women-purple-blonde.jpeg",
    featured: false,
  },
];

export function getCollectionBySlug(slug: string): Collection | undefined {
  return collections.find((c) => c.slug === slug);
}
