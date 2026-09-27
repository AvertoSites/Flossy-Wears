"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

export type HeroSlide = { src: string; alt: string };

/** Stacks the slides and crossfades between them on a fixed interval. */
export function HeroSlideshow({
  slides,
  interval = 5000,
}: {
  slides: HeroSlide[];
  interval?: number;
}) {
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = setInterval(
      () => setActive((i) => (i + 1) % slides.length),
      interval,
    );
    return () => clearInterval(timer);
  }, [slides.length, interval]);

  return (
    <div className="relative h-full">
      {slides.map((slide, i) => (
        <Image
          key={slide.src}
          src={slide.src}
          alt={slide.alt}
          fill
          priority={i === 0}
          sizes="50vw"
          aria-hidden={i !== active}
          className={cn(
            "object-cover object-top transition-opacity duration-1000 ease-in-out",
            i === active ? "opacity-100" : "opacity-0",
          )}
        />
      ))}
    </div>
  );
}
