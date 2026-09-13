import {
  getFeaturedCollections,
  getNewArrivals,
  getProductsByCollection,
} from "@/lib/api";
import { Hero } from "@/components/home/hero";
import { ValueProps } from "@/components/home/value-props";
import { TheFourFeature } from "@/components/home/the-four-feature";
import { ProductCarousel } from "@/components/product/product-carousel";
import { CollectionTiles } from "@/components/home/collection-tiles";
import { BrandStory } from "@/components/home/brand-story";
import { Testimonials } from "@/components/home/testimonials";
import { InstagramStrip } from "@/components/home/instagram-strip";

export default async function HomePage() {
  const [theFour, newArrivals, collections] = await Promise.all([
    getProductsByCollection("the-four"),
    getNewArrivals(8),
    getFeaturedCollections(),
  ]);

  return (
    <>
      <Hero />
      <ValueProps />
      <TheFourFeature products={theFour} />
      <ProductCarousel
        eyebrow="Fresh off the press"
        title="New arrivals"
        description="The latest additions to the line."
        action={{ label: "View all", href: "/collections/new-arrivals" }}
        products={newArrivals}
      />
      <CollectionTiles collections={collections} />
      <BrandStory />
      <Testimonials />
      <InstagramStrip />
    </>
  );
}
