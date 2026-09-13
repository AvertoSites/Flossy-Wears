import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { getProductsByCollection } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Price } from "@/components/common/price";

export const metadata: Metadata = {
  title: "The Four",
  description:
    "The October 2026 drop from Flossy Wears — four verses, four colourways, one statement.",
};

export default async function TheFourPage() {
  const products = await getProductsByCollection("the-four");

  return (
    <>
      <section className="relative overflow-hidden bg-navy text-primary-foreground">
        <Image
          src="/image/four-campaign-cover.jpeg"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover opacity-25"
        />
        <div className="container-page relative flex flex-col items-center gap-4 py-24 text-center">
          <span className="text-xs font-medium uppercase tracking-[0.28em] text-gold-light">
            A Flossy Wears design · October 2026
          </span>
          <h1 className="font-display text-5xl text-primary-foreground sm:text-7xl">
            The Four
          </h1>
          <p className="max-w-xl text-primary-foreground/80">
            Four verses. Four colourways. One statement. Photographed for the
            cover, built to be lived in. Wear your faith with pride.
          </p>
          <Button asChild size="lg" className="mt-2">
            <Link href="/collections/the-four">Shop the collection</Link>
          </Button>
        </div>
      </section>

      <section className="container-page py-16">
        <div className="grid gap-10">
          {products.slice(0, 4).map((product, i) => (
            <div
              key={product.id}
              className={`grid items-center gap-8 lg:grid-cols-2 ${
                i % 2 === 1 ? "lg:[&>div:first-child]:order-last" : ""
              }`}
            >
              <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-cream">
                <Image
                  src={product.images[0]}
                  alt={product.name}
                  fill
                  sizes="(min-width: 1024px) 45vw, 90vw"
                  className="object-cover"
                />
              </div>
              <div className="flex flex-col gap-3">
                <span className="text-xs font-medium uppercase tracking-[0.2em] text-gold-dark">
                  {product.verse.reference}
                </span>
                <h2 className="font-display text-3xl">
                  &ldquo;{product.verse.text}&rdquo;
                </h2>
                <p className="text-sm text-muted-foreground">
                  {product.description}
                </p>
                <div className="mt-1 flex items-center gap-4">
                  <Price value={product.price.amount} />
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/products/${product.slug}`}>Shop {product.name}</Link>
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
