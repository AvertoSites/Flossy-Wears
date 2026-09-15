import { COLOURS, SIZES } from "@/lib/constants";
import type {
  Product,
  ProductBadge,
  ProductCategory,
  ProductType,
  ProductVariant,
} from "@/types";

type Seed = {
  slug: string;
  name: string;
  tagline: string;
  description?: string;
  verse: { text: string; reference: string };
  type: ProductType;
  category: ProductCategory;
  collectionSlugs: string[];
  price: number;
  compareAtPrice?: number;
  colours: string[];
  images: string[];
  badges: ProductBadge[];
  rating: number;
  reviewCount: number;
  createdAt: string;
  needsPhotography?: boolean;
  /** Base design for "Customise Your Own". Defaults to true for sweatshirts/hoodies. */
  customizable?: boolean;
};

const FABRIC =
  "400gsm heavyweight loopback cotton fleece. Cut-and-sew in Portugal, printed in the UK.";
const CARE = [
  "Wash inside out at 30°C",
  "Do not tumble dry",
  "Iron on reverse, avoid the print",
  "Do not dry clean",
];
const FIT_CREW = "Relaxed unisex fit with dropped shoulders. Size down for a classic fit.";
const FIT_TEE = "Boxy mid-weight fit. True to size.";

const seeds: Seed[] = [
  {
    slug: "the-hope-crewneck",
    name: "The Hope Crewneck",
    tagline: "Christ in me, the hope of glory.",
    description:
      "A powerful expression of faith, identity and hope. “Christ in me, the hope of glory” is a reminder that hope is not found in circumstances, but in the presence of Christ within us. This design is for those who carry their faith confidently — a meaningful statement that remains stylish enough for everyday wear. Wear it as a reminder. Wear it as a declaration. Wear your faith with pride.",
    verse: { text: "Christ in me — the hope of glory", reference: "Colossians 1:27" },
    type: "sweatshirt",
    category: "unisex",
    collectionSlugs: ["the-four", "for-him", "new-arrivals"],
    price: 6800,
    colours: ["heather", "bone", "black"],
    images: ["/image/four-hope-men-grey.jpeg", "/image/four-campaign-cover.jpeg"],
    badges: ["bestseller", "new"],
    rating: 4.9,
    reviewCount: 138,
    createdAt: "2026-09-01",
  },
  {
    slug: "walk-by-faith-crewneck",
    name: "Walk by Faith Crewneck",
    tagline: "For we walk by faith, not by sight.",
    description:
      "A powerful reminder to trust God even when the way forward is unclear. This design represents the courage to keep moving, believing that God is guiding every step. Created for those who choose faith over fear, trust over uncertainty and God’s promises over what they can see. Wear it as a reminder. Wear it as a declaration. Wear your faith with pride.",
    verse: { text: "For we walk by faith and not by sight", reference: "2 Corinthians 5:7" },
    type: "sweatshirt",
    category: "unisex",
    collectionSlugs: ["the-four", "for-him", "new-arrivals"],
    price: 6800,
    colours: ["brown", "black", "olive"],
    images: ["/image/four-faith-men-brown.jpeg", "/image/four-campaign-cover.jpeg"],
    badges: ["bestseller", "new"],
    rating: 4.8,
    reviewCount: 96,
    createdAt: "2026-09-01",
  },
  {
    slug: "god-is-within-her-crewneck",
    name: "God Is Within Her Crewneck",
    tagline: "She shall not be moved.",
    description:
      "A bold declaration of strength, faith and unwavering confidence in God. This design reminds every woman that she is never standing alone — God is within her, giving her strength to remain grounded through every season. Created for the woman who knows who she is, trusts where she is going and refuses to be shaken by circumstances. Wear it as a reminder. Wear it as a declaration. Wear your faith with pride.",
    verse: { text: "God is within her, she shall not be moved", reference: "Psalm 46:5" },
    type: "sweatshirt",
    category: "women",
    collectionSlugs: ["the-four", "for-her", "new-arrivals"],
    price: 6800,
    colours: ["olive", "bone", "purple"],
    images: [
      "/image/four-god-within-her-women-olive.jpeg",
      "/image/four-god-within-her-women-olive-campaign.jpeg",
      "/image/four-god-within-her-women-purple-office.jpeg",
      "/image/four-campaign-cover.jpeg",
    ],
    badges: ["bestseller", "new"],
    rating: 5,
    reviewCount: 211,
    createdAt: "2026-09-01",
  },
  {
    slug: "blessed-is-she-crewneck",
    name: "Blessed Is She Crewneck",
    tagline: "Blessed is she that believed.",
    description:
      "A celebration of faith, expectation and the strength of believing in what God has promised. This design is created especially as an uplifting statement for women who choose to walk confidently in faith and hope. Wear it as a reminder. Wear it as a declaration. Wear your faith with pride.",
    verse: { text: "Blessed is she that believes", reference: "Luke 1:45" },
    type: "sweatshirt",
    category: "women",
    collectionSlugs: ["the-four", "for-her", "new-arrivals"],
    price: 6800,
    colours: ["purple", "bone", "heather"],
    images: [
      "/image/four-believes-women-purple-blonde.jpeg",
      "/image/four-believes-women-purple.jpeg",
      "/image/four-believes-women-grey-campaign.jpeg",
      "/image/four-campaign-cover.jpeg",
    ],
    badges: ["new"],
    rating: 4.7,
    reviewCount: 74,
    createdAt: "2026-09-01",
  },
  {
    slug: "be-still-crewneck",
    name: "Be Still Crewneck",
    tagline: "Be still, and know.",
    verse: { text: "Be still and know that I am God", reference: "Psalm 46:10" },
    type: "sweatshirt",
    category: "unisex",
    collectionSlugs: ["for-him", "for-her"],
    price: 6500,
    colours: ["heather", "olive", "black"],
    images: ["/image/four-hope-men-grey.jpeg", "/image/four-faith-men-brown.jpeg"],
    badges: [],
    rating: 4.6,
    reviewCount: 52,
    createdAt: "2026-07-14",
    needsPhotography: true,
  },
  {
    slug: "fearfully-made-tee",
    name: "Fearfully Made Tee",
    tagline: "Wonderfully made.",
    verse: {
      text: "I am fearfully and wonderfully made",
      reference: "Psalm 139:14",
    },
    type: "t-shirt",
    category: "women",
    collectionSlugs: ["for-her"],
    price: 3200,
    colours: ["bone", "heather", "purple"],
    images: ["/image/four-god-within-her-women-olive.jpeg", "/image/four-believes-women-purple-blonde.jpeg"],
    badges: [],
    rating: 4.8,
    reviewCount: 63,
    createdAt: "2026-06-30",
    needsPhotography: true,
  },
  {
    slug: "rejoice-always-tee",
    name: "Rejoice Always Tee",
    tagline: "Rejoice always. Pray continually.",
    verse: { text: "Rejoice always, pray continually", reference: "1 Thessalonians 5:16" },
    type: "t-shirt",
    category: "unisex",
    collectionSlugs: ["for-him", "for-her"],
    price: 3200,
    colours: ["bone", "black", "olive"],
    images: ["/image/four-campaign-cover.jpeg", "/image/four-hope-men-grey.jpeg"],
    badges: [],
    rating: 4.5,
    reviewCount: 40,
    createdAt: "2026-06-12",
    needsPhotography: true,
  },
  {
    slug: "strength-and-dignity-crewneck",
    name: "Strength & Dignity Crewneck",
    tagline: "She is clothed with strength and dignity.",
    verse: {
      text: "She is clothed with strength and dignity",
      reference: "Proverbs 31:25",
    },
    type: "sweatshirt",
    category: "women",
    collectionSlugs: ["for-her"],
    price: 6500,
    colours: ["purple", "bone", "brown"],
    images: ["/image/four-believes-women-purple-blonde.jpeg", "/image/four-god-within-her-women-olive.jpeg"],
    badges: ["bestseller"],
    rating: 4.9,
    reviewCount: 118,
    createdAt: "2026-05-20",
    needsPhotography: true,
  },
  {
    slug: "iron-sharpens-iron-hoodie",
    name: "Iron Sharpens Iron Hoodie",
    tagline: "As iron sharpens iron.",
    verse: { text: "As iron sharpens iron, so one sharpens another", reference: "Proverbs 27:17" },
    type: "hoodie",
    category: "men",
    collectionSlugs: ["for-him"],
    price: 7800,
    colours: ["black", "heather", "olive"],
    images: ["/image/four-faith-men-brown.jpeg", "/image/four-hope-men-grey.jpeg"],
    badges: ["new"],
    rating: 4.7,
    reviewCount: 58,
    createdAt: "2026-08-18",
    needsPhotography: true,
  },
  {
    slug: "do-everything-in-love-hoodie",
    name: "Do Everything in Love Hoodie",
    tagline: "Let all that you do be done in love.",
    verse: { text: "Do everything in love", reference: "1 Corinthians 16:14" },
    type: "hoodie",
    category: "unisex",
    collectionSlugs: ["for-him", "for-her"],
    price: 7800,
    colours: ["bone", "brown", "black"],
    images: ["/image/four-campaign-cover.jpeg", "/image/four-god-within-her-women-olive.jpeg"],
    badges: [],
    rating: 4.6,
    reviewCount: 44,
    createdAt: "2026-08-02",
    needsPhotography: true,
  },
  {
    slug: "the-lord-is-my-shepherd-crewneck",
    name: "The Lord Is My Shepherd Crewneck",
    tagline: "I shall not want.",
    verse: { text: "The Lord is my shepherd, I shall not want", reference: "Psalm 23:1" },
    type: "sweatshirt",
    category: "unisex",
    collectionSlugs: ["for-him", "for-her", "sale"],
    price: 5200,
    compareAtPrice: 6500,
    colours: ["olive", "heather", "brown"],
    images: ["/image/four-hope-men-grey.jpeg", "/image/four-believes-women-purple-blonde.jpeg"],
    badges: ["sale"],
    rating: 4.8,
    reviewCount: 152,
    createdAt: "2026-02-10",
    needsPhotography: true,
  },
  {
    slug: "more-than-conquerors-tee",
    name: "More Than Conquerors Tee",
    tagline: "In all these things.",
    verse: { text: "We are more than conquerors through Him", reference: "Romans 8:37" },
    type: "t-shirt",
    category: "men",
    collectionSlugs: ["for-him", "sale"],
    price: 2400,
    compareAtPrice: 3200,
    colours: ["black", "bone", "olive"],
    images: ["/image/four-faith-men-brown.jpeg", "/image/four-campaign-cover.jpeg"],
    badges: ["sale"],
    rating: 4.4,
    reviewCount: 37,
    createdAt: "2026-01-22",
    needsPhotography: true,
  },
  {
    slug: "grace-upon-grace-crewneck",
    name: "Grace Upon Grace Crewneck",
    tagline: "From His fullness we have all received.",
    verse: { text: "Grace upon grace", reference: "John 1:16" },
    type: "sweatshirt",
    category: "unisex",
    collectionSlugs: ["for-him", "for-her", "new-arrivals"],
    price: 6500,
    colours: ["bone", "heather", "purple"],
    images: ["/image/four-god-within-her-women-olive.jpeg", "/image/four-hope-men-grey.jpeg"],
    badges: ["new"],
    rating: 4.9,
    reviewCount: 61,
    createdAt: "2026-09-03",
    needsPhotography: true,
  },
  {
    slug: "walk-humbly-tee",
    name: "Walk Humbly Tee",
    tagline: "Act justly. Love mercy.",
    verse: { text: "Act justly, love mercy, walk humbly", reference: "Micah 6:8" },
    type: "t-shirt",
    category: "unisex",
    collectionSlugs: ["for-him", "for-her"],
    price: 3200,
    colours: ["olive", "bone", "black"],
    images: ["/image/four-believes-women-purple-blonde.jpeg", "/image/four-faith-men-brown.jpeg"],
    badges: [],
    rating: 4.7,
    reviewCount: 29,
    createdAt: "2026-07-01",
    needsPhotography: true,
  },
];

function buildVariants(seed: Seed): ProductVariant[] {
  const variants: ProductVariant[] = [];
  seed.colours.forEach((colourKey, ci) => {
    SIZES.forEach((size, si) => {
      // Deterministic pseudo-stock so the UI shows sold-out and low-stock states.
      const stockSeed = (ci * 7 + si * 13 + seed.slug.length) % 17;
      const stock = stockSeed === 0 ? 0 : stockSeed < 3 ? stockSeed : stockSeed + 5;
      variants.push({
        id: `${seed.slug}__${colourKey}__${size.value}`,
        sku: `FW-${seed.slug.slice(0, 6).toUpperCase()}-${colourKey.slice(0, 2).toUpperCase()}-${size.value.toUpperCase()}`,
        colour: colourKey,
        size: size.value,
        price: { amount: seed.price, currency: "GBP" },
        compareAtPrice: seed.compareAtPrice
          ? { amount: seed.compareAtPrice, currency: "GBP" }
          : undefined,
        stock,
        images: seed.images,
      });
    });
  });
  return variants;
}

export const products: Product[] = seeds.map((seed, index) => ({
  id: `prod_${String(index + 1).padStart(3, "0")}`,
  slug: seed.slug,
  name: seed.name,
  tagline: seed.tagline,
  description:
    seed.description ??
    `${seed.tagline} ${seed.verse.reference} printed on our heavyweight ${seed.type.replace("-", " ")}. A calm, editorial take on faithwear — soft brushed fleece, ribbed cuffs and a print made to age well. Wear your faith with pride.`,
  verse: seed.verse,
  type: seed.type,
  category: seed.category,
  collectionSlugs: seed.collectionSlugs,
  price: { amount: seed.price, currency: "GBP" },
  compareAtPrice: seed.compareAtPrice
    ? { amount: seed.compareAtPrice, currency: "GBP" }
    : undefined,
  colours: seed.colours.map((c) => COLOURS[c]),
  sizes: SIZES,
  variants: buildVariants(seed),
  images: seed.images,
  badges: seed.badges,
  rating: seed.rating,
  reviewCount: seed.reviewCount,
  fabric: FABRIC,
  care: CARE,
  fit: seed.type === "t-shirt" ? FIT_TEE : FIT_CREW,
  needsPhotography: seed.needsPhotography,
  customizable: seed.customizable ?? seed.type !== "t-shirt",
  createdAt: seed.createdAt,
}));

export function getProductBySlug(slug: string): Product | undefined {
  return products.find((p) => p.slug === slug);
}
