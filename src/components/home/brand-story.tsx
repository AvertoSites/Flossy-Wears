import Image from "next/image";
import Link from "next/link";
import { ArrowRightIcon } from "lucide-react";

export function BrandStory() {
  return (
    <section className="bg-navy text-primary-foreground">
      <div className="container-page grid items-center gap-10 py-16 lg:grid-cols-2 lg:py-24">
        <div className="relative order-last aspect-[4/3] overflow-hidden rounded-xl lg:order-first">
          <Image
            src="/image/believes/four-campaign-poster-believes.jpeg"
            alt="Flossy Wears campaign poster — more than clothing, a message"
            fill
            sizes="(min-width: 1024px) 45vw, 90vw"
            className="object-cover"
          />
        </div>
        <div className="flex flex-col gap-5">
          <span className="text-xs font-medium uppercase tracking-[0.24em] text-gold-light">
            Same faith, bigger purpose
          </span>
          <h2 className="text-3xl text-primary-foreground sm:text-4xl">
            Faithwear that actually looks good
          </h2>
          <p className="max-w-md text-primary-foreground/80">
            Flossy Wears started with a simple frustration: Christian clothing that
            felt like a compromise. So we built the opposite — heavyweight,
            considered, quietly bold. Every piece pairs a verse with a design you&rsquo;d
            wear even without the words.
          </p>
          <Link
            href="/about"
            className="group inline-flex items-center gap-2 text-sm font-medium text-primary-foreground underline-offset-4 hover:underline"
          >
            Read our story
            <ArrowRightIcon className="size-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </div>
    </section>
  );
}
