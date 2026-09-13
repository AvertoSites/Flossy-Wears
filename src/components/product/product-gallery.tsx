"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import useEmblaCarousel from "embla-carousel-react";
import Zoom from "react-medium-image-zoom";
import "react-medium-image-zoom/dist/styles.css";
import { cn } from "@/lib/utils";

export function ProductGallery({
  images,
  alt,
}: {
  images: string[];
  alt: string;
}) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: images.length > 1 });
  const [selected, setSelected] = useState(0);

  useEffect(() => {
    if (!emblaApi) return;
    const onSelect = () => setSelected(emblaApi.selectedScrollSnap());
    onSelect();
    emblaApi.on("select", onSelect).on("reInit", onSelect);
    return () => {
      emblaApi.off("select", onSelect).off("reInit", onSelect);
    };
  }, [emblaApi]);

  // Reset to first slide when the image set changes (colour switch).
  useEffect(() => {
    emblaApi?.scrollTo(0);
  }, [emblaApi, images]);

  return (
    <div className="flex flex-col gap-3">
      <div className="overflow-hidden rounded-xl bg-cream" ref={emblaRef}>
        <div className="flex">
          {images.map((src, i) => (
            <div key={`${src}-${i}`} className="relative min-w-0 flex-[0_0_100%]">
              <div className="relative aspect-[4/5]">
                <Zoom>
                  <Image
                    src={src}
                    alt={`${alt} — view ${i + 1}`}
                    fill
                    priority={i === 0}
                    sizes="(min-width: 1024px) 45vw, 100vw"
                    className="object-cover"
                  />
                </Zoom>
              </div>
            </div>
          ))}
        </div>
      </div>

      {images.length > 1 && (
        <div className="flex gap-2">
          {images.map((src, i) => (
            <button
              key={`${src}-thumb-${i}`}
              type="button"
              onClick={() => emblaApi?.scrollTo(i)}
              className={cn(
                "relative aspect-[4/5] w-16 shrink-0 overflow-hidden rounded-md border bg-cream transition-colors",
                selected === i ? "border-navy" : "border-transparent",
              )}
            >
              <Image
                src={src}
                alt=""
                fill
                sizes="64px"
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
