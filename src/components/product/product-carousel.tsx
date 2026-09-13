"use client";

import { useCallback, useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { ProductCard } from "@/components/product/product-card";
import { SectionHeading } from "@/components/common/section-heading";
import { cn } from "@/lib/utils";
import type { Product } from "@/types";

export function ProductCarousel({
  products,
  eyebrow,
  title,
  description,
  action,
}: {
  products: Product[];
  eyebrow?: string;
  title: string;
  description?: string;
  action?: { label: string; href: string };
}) {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: "start",
    dragFree: true,
    containScroll: "trimSnaps",
  });
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setCanPrev(emblaApi.canScrollPrev());
    setCanNext(emblaApi.canScrollNext());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    // Sync arrow state to Embla's current + future positions.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    onSelect();
    emblaApi.on("select", onSelect).on("reInit", onSelect);
    return () => {
      emblaApi.off("select", onSelect).off("reInit", onSelect);
    };
  }, [emblaApi, onSelect]);

  return (
    <section className="container-page py-16">
      <div className="flex items-end justify-between gap-4">
        <SectionHeading
          eyebrow={eyebrow}
          title={title}
          description={description}
          action={action}
        />
        <div className="hidden shrink-0 gap-2 sm:flex">
          <button
            type="button"
            aria-label="Previous"
            onClick={() => emblaApi?.scrollPrev()}
            disabled={!canPrev}
            className="grid size-9 place-items-center rounded-full border border-input transition-colors hover:bg-cream disabled:opacity-40"
          >
            <ChevronLeftIcon className="size-4" />
          </button>
          <button
            type="button"
            aria-label="Next"
            onClick={() => emblaApi?.scrollNext()}
            disabled={!canNext}
            className="grid size-9 place-items-center rounded-full border border-input transition-colors hover:bg-cream disabled:opacity-40"
          >
            <ChevronRightIcon className="size-4" />
          </button>
        </div>
      </div>

      <div className="mt-8 overflow-hidden" ref={emblaRef}>
        <div className="flex gap-4">
          {products.map((product) => (
            <div
              key={product.id}
              className={cn(
                "min-w-0 shrink-0",
                "basis-[70%] sm:basis-[38%] lg:basis-[28%]",
              )}
            >
              <ProductCard product={product} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
