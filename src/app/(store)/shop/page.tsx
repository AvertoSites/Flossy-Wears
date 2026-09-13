import { Suspense } from "react";
import type { Metadata } from "next";
import { PageHeader } from "@/components/common/page-header";
import { ShopView } from "@/components/shop/shop-view";

export const metadata: Metadata = {
  title: "Shop all",
  description:
    "Browse every Flossy Wears piece — heavyweight scripture sweatshirts, tees and hoodies. Designed in the UK.",
};

export default function ShopPage() {
  return (
    <>
      <PageHeader
        eyebrow="The full line"
        title="Shop all"
        description="Every verse, every colourway. Filter by style, colour, size and price."
        crumbs={[{ label: "Home", href: "/" }, { label: "Shop" }]}
      />
      <Suspense fallback={<div className="container-page py-20" />}>
        <ShopView />
      </Suspense>
    </>
  );
}
