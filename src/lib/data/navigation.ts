export type NavLink = {
  label: string;
  href: string;
  description?: string;
};

export type NavColumn = {
  heading: string;
  links: NavLink[];
};

export type NavItem = {
  label: string;
  href: string;
  /** When present, renders a mega-menu panel. */
  columns?: NavColumn[];
  feature?: {
    title: string;
    copy: string;
    href: string;
    image: string;
  };
};

export const primaryNav: NavItem[] = [
  {
    label: "Shop",
    href: "/shop",
    columns: [
      {
        heading: "Category",
        links: [
          { label: "All products", href: "/shop" },
          { label: "Sweatshirts", href: "/shop?type=sweatshirt" },
          { label: "T-shirts", href: "/shop?type=t-shirt" },
          { label: "Hoodies", href: "/shop?type=hoodie" },
        ],
      },
      {
        heading: "Shop by",
        links: [
          { label: "Women", href: "/shop?category=women" },
          { label: "Men", href: "/shop?category=men" },
          { label: "New in", href: "/shop?badges=new" },
          { label: "Sale", href: "/collections/sale" },
        ],
      },
    ],
    feature: {
      title: "The Four",
      copy: "Four verses, one drop. Available now.",
      href: "/collections/the-four",
      image: "/image/four-campaign-cover.jpeg",
    },
  },
  {
    label: "Collections",
    href: "/collections/the-four",
    columns: [
      {
        heading: "Collections",
        links: [
          { label: "The Four", href: "/collections/the-four" },
          { label: "For Her", href: "/collections/for-her" },
          { label: "For Him", href: "/collections/for-him" },
          { label: "New Arrivals", href: "/collections/new-arrivals" },
          { label: "Sale", href: "/collections/sale" },
        ],
      },
    ],
  },
  { label: "The Four", href: "/the-four" },
  { label: "Customise Your Own", href: "/customise" },
  { label: "Our Story", href: "/about" },
];

export const footerNav: NavColumn[] = [
  {
    heading: "Shop",
    links: [
      { label: "All products", href: "/shop" },
      { label: "The Four", href: "/collections/the-four" },
      { label: "New arrivals", href: "/collections/new-arrivals" },
      { label: "Sale", href: "/collections/sale" },
      { label: "Customise your own", href: "/customise" },
      { label: "Gift cards", href: "/shop" },
    ],
  },
  {
    heading: "Help",
    links: [
      { label: "Size guide", href: "/sizing" },
      { label: "Shipping & returns", href: "/shipping-returns" },
      { label: "FAQ", href: "/faq" },
      { label: "Track order", href: "/track" },
    ],
  },
  {
    heading: "Company",
    links: [
      { label: "Our story", href: "/about" },
      { label: "The Four campaign", href: "/the-four" },
      { label: "Privacy policy", href: "/legal/privacy" },
      { label: "Terms of service", href: "/legal/terms" },
    ],
  },
];
