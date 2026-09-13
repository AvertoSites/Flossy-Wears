export type FaqGroup = {
  heading: string;
  items: { q: string; a: string }[];
};

export const faqGroups: FaqGroup[] = [
  {
    heading: "Orders & delivery",
    items: [
      {
        q: "How long does delivery take?",
        a: "UK standard delivery (Royal Mail Tracked 48) is 2–4 working days. Express (Tracked 24) is 1–2 working days. Orders placed before 1pm are dispatched the same working day.",
      },
      {
        q: "Is delivery free?",
        a: "UK delivery is free on all orders over £75. Below that, standard delivery is £3.95 and express is £5.95.",
      },
      {
        q: "Do you ship internationally?",
        a: "Not yet — we currently ship within the UK only. International delivery is coming soon; join the newsletter to hear first.",
      },
    ],
  },
  {
    heading: "Returns & exchanges",
    items: [
      {
        q: "What's your returns policy?",
        a: "Return any unworn item with tags attached within 30 days for a full refund. Refunds are processed within 5 working days of us receiving the parcel.",
      },
      {
        q: "How do I exchange for a different size?",
        a: "Place a new order for the size you want and return the original for a refund — it's the fastest way to make sure the size you need doesn't sell out.",
      },
    ],
  },
  {
    heading: "Products & sizing",
    items: [
      {
        q: "How do the sweatshirts fit?",
        a: "They're a relaxed unisex fit with dropped shoulders. If you prefer a classic fit, size down. See the size guide on any product page.",
      },
      {
        q: "How should I wash them?",
        a: "Wash inside out at 30°C, don't tumble dry, and iron on the reverse avoiding the print. The heavyweight fleece holds its shape for years with this care.",
      },
      {
        q: "Will the print crack?",
        a: "Our prints are applied to last. Following the care instructions, the print will age gracefully with the garment rather than cracking or peeling.",
      },
    ],
  },
];
