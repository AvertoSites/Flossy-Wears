import Link from "next/link";
import { HeroSlideshow, type HeroSlide } from "@/components/home/hero-slideshow";

/** One slide per image group, so the hero previews the whole range. */
const WOMEN: HeroSlide[] = [
  {
    src: "/image/african-print-hoodies/patchwork-africa-hoodie-women-yellow.jpeg",
    alt: "Woman wearing the yellow African Heritage Print hoodie",
  },
  {
    src: "/image/believes/four-believes-women-purple-solo.jpeg",
    alt: "Woman wearing the purple Believes crewneck",
  },
  {
    src: "/image/hoodie-dresses/hooded-maxi-dress-black-studio.jpeg",
    alt: "Woman wearing the black Hooded Maxi Dress",
  },
  {
    src: "/image/god-within-her/four-god-within-her-women-olive-solo.jpeg",
    alt: "Woman wearing the olive God Is Within Her crewneck",
  },
  {
    src: "/image/christmas-jumpers/reason-for-the-season-jumper-women-red.jpeg",
    alt: "Woman wearing the red 'Jesus is the reason for the season' Christmas jumper",
  },
];

const MEN: HeroSlide[] = [
  {
    src: "/image/african-print-hoodies/patchwork-africa-hoodie-men-yellow.jpeg",
    alt: "Man wearing the yellow African Heritage Print hoodie",
  },
  {
    src: "/image/faith/four-faith-men-brown.jpeg",
    alt: "Man wearing the brown Faith crewneck",
  },
  {
    src: "/image/hope/four-hope-men-maroon-solo.jpeg",
    alt: "Man wearing the maroon Hope crewneck",
  },
  {
    src: "/image/christmas-jumpers/reason-for-the-season-jumper-men-red.jpeg",
    alt: "Man wearing the red 'Jesus is the reason for the season' Christmas jumper",
  },
];

const CTAS = [
  { label: "Shop women", href: "/shop?category=women" },
  { label: "Shop men", href: "/shop?category=men" },
];

export function Hero() {
  return (
    <section className="relative isolate overflow-hidden bg-navy">
      <div className="grid h-[calc(100svh-6.25rem)] min-h-[520px] grid-cols-2">
        <HeroSlideshow slides={WOMEN} />
        <HeroSlideshow slides={MEN} />
      </div>

      <span className="pointer-events-none absolute inset-0 bg-black/25" />

      <div className="absolute inset-0 flex flex-col items-center justify-center gap-5 px-4 text-center">
        <h1 className="font-display text-5xl leading-none text-white sm:text-7xl lg:text-8xl">
          Wear your faith
        </h1>
        <p className="max-w-md text-base text-white/90 sm:text-lg">
          Scripture, heritage and purpose — thoughtfully made pieces for
          everyday wear.
        </p>
        <div className="mt-2 flex flex-wrap justify-center gap-3 sm:gap-5">
          {CTAS.map((cta) => (
            <Link
              key={cta.href}
              href={cta.href}
              className="min-w-40 bg-paper px-8 py-3.5 text-center text-sm uppercase tracking-[0.2em] text-foreground transition-colors hover:bg-white sm:min-w-56"
            >
              {cta.label}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
