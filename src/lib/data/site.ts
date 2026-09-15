export const site = {
  name: "Flossy Wears",
  shortName: "FW",
  tagline: "Faith you can wear.",
  description:
    "Flossy Wears makes premium, editorial faith apparel — heavyweight sweatshirts and tees carrying Scripture worth wearing. Designed in the UK.",
  url: "https://flossywears.co.uk",
  email: "flossywears@gmail.com",
  phone: "+44 20 7946 0958",
  currency: "GBP" as const,
  locale: "en-GB",
  social: {
    instagram: "https://instagram.com/flossywearsuk",
    instagramHandle: "@flossywearsuk",
    facebook: "https://www.facebook.com/flossywears",
  },
  address: "Studio 4, Peckham Levels, London SE15 4ST",
};

export type SiteConfig = typeof site;
