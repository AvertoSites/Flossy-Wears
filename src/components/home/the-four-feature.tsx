import Image from "next/image";
import Link from "next/link";
import { ArrowRightIcon } from "lucide-react";
import { Price } from "@/components/common/price";
import type { Product } from "@/types";

export function TheFourFeature({ products }: { products: Product[] }) {
  const four = products.slice(0, 4);
  return (
    <section className="container-page py-16 sm:py-20">
      <div className="flex flex-col items-center gap-3 text-center">
        <span className="text-xs font-medium uppercase tracking-[0.24em] text-gold-dark">
          A Flossy Wears design
        </span>
        <h2 className="font-display text-4xl sm:text-5xl">The Four</h2>
        <p className="max-w-lg text-muted-foreground">
          Four verses, four colourways, one statement. Photographed for the cover,
          built to be lived in.
        </p>
      </div>

      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {four.map((product) => (
          <Link
            key={product.id}
            href={`/products/${product.slug}`}
            className="group flex flex-col gap-3"
          >
            <div className="relative aspect-[4/5] overflow-hidden rounded-lg bg-cream">
              <Image
                src={product.images[0]}
                alt={product.name}
                fill
                sizes="(min-width: 1024px) 22vw, (min-width: 640px) 45vw, 90vw"
                className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
              />
            </div>
            <div>
              <p className="text-sm font-medium">{product.name}</p>
              <p className="text-xs text-muted-foreground">
                {product.verse.reference}
              </p>
              <Price value={product.price.amount} className="mt-1 text-sm" />
            </div>
          </Link>
        ))}
      </div>

      <div className="mt-10 flex justify-center">
        <Link
          href="/collections/the-four"
          className="group inline-flex items-center gap-2 text-sm font-medium text-navy underline-offset-4 hover:underline"
        >
          Shop the collection
          <ArrowRightIcon className="size-4 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>
    </section>
  );
}
