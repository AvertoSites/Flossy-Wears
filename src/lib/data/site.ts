export const site = {
  name: "Flossy Wears",
  shortName: "FW",
  tagline: "Faith you can wear.",
  description:
    "Flossy Wears makes premium, editorial faith apparel — Scripture sweatshirts and tees, African heritage print hoodies, hooded maxi dresses and Christmas jumpers. Designed in the UK.",
  url: "https://flossywears.co.uk",
  email: "flossywears@gmail.com",
  phone: "+44 7935 828743",
  currency: "GBP" as const,
  locale: "en-GB",
  social: {
    instagram: "https://instagram.com/flossywearsuk",
    instagramHandle: "@flossywearsuk",
    facebook: "https://www.facebook.com/flossywears",
  },
  address: "13 Skipsea Road, Sheffield S2 1BT",
  /** In-store collection point — mirrored in `functions/src/email.ts` (separate TS project). */
  collection: {
    address: "13 Skipsea Road, Sheffield S2 1BT",
    hours: "Mon–Sat, 10am–6pm",
    instructions:
      "Please bring your order confirmation email (on your phone is fine) as proof of purchase.",
  },
};

export type SiteConfig = typeof site;
