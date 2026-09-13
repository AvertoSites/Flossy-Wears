import type { Address, Customer, Order } from "@/types";

/** Stand-in signed-in customer for the mock account area. */
export const demoCustomer: Customer = {
  id: "cust_demo",
  firstName: "Amara",
  lastName: "Okafor",
  email: "amara@example.com",
};

export const demoAddresses: Address[] = [
  {
    id: "addr_1",
    firstName: "Amara",
    lastName: "Okafor",
    line1: "14 Bellenden Road",
    city: "London",
    county: "Greater London",
    postcode: "SE15 4RB",
    country: "United Kingdom",
    phone: "07700 900123",
    isDefault: true,
  },
  {
    id: "addr_2",
    firstName: "Amara",
    lastName: "Okafor",
    line1: "Flossy Wears Studio",
    line2: "Peckham Levels, 95A Rye Lane",
    city: "London",
    postcode: "SE15 4TG",
    country: "United Kingdom",
  },
];

export const demoOrders: Order[] = [
  {
    id: "order_1042",
    number: "FW-1042",
    status: "shipped",
    placedAt: "2026-09-02",
    lines: [
      {
        name: "God Is Within Her Crewneck",
        colourLabel: "Olive",
        size: "M",
        quantity: 1,
        price: 6800,
        image: "/image/four-god-within-her-women-olive.jpeg",
      },
      {
        name: "Blessed Is She Crewneck",
        colourLabel: "Royal Purple",
        size: "M",
        quantity: 1,
        price: 6800,
        image: "/image/four-believes-women-purple-blonde.jpeg",
      },
    ],
    subtotal: 13600,
    shipping: 0,
    discount: 1360,
    total: 12240,
    shippingAddress: demoAddresses[0],
    shippingMethod: "Standard delivery",
    trackingUrl: "https://www.royalmail.com/track-your-item",
  },
  {
    id: "order_0987",
    number: "FW-0987",
    status: "delivered",
    placedAt: "2026-07-19",
    lines: [
      {
        name: "Walk by Faith Crewneck",
        colourLabel: "Chocolate",
        size: "L",
        quantity: 1,
        price: 6800,
        image: "/image/four-faith-men-brown.jpeg",
      },
    ],
    subtotal: 6800,
    shipping: 395,
    discount: 0,
    total: 7195,
    shippingAddress: demoAddresses[0],
    shippingMethod: "Standard delivery",
  },
];
