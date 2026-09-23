import Image from "next/image";
import Link from "next/link";
import { ArrowRightIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Hero() {
  return (
    <section className="border-b border-border bg-cream">
      <div className="container-page grid items-center gap-10 py-12 lg:grid-cols-[1fr_1.2fr] lg:py-16">
        <div className="flex flex-col gap-6">
          <span className="text-xs font-medium uppercase tracking-[0.24em] text-gold-dark">
            The October 2026 drop
          </span>
          <h1 className="text-4xl leading-[1.05] sm:text-5xl lg:text-6xl">
            Wear your faith
            <br />
            with pride.
          </h1>
          <p className="max-w-md text-muted-foreground">
            Heavyweight crewnecks and tees carrying Scripture worth wearing.
            Editorial, understated, made in the UK — faith you can live in.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link href="/collections/the-four">
                Shop The Four
                <ArrowRightIcon className="size-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/shop">Shop all</Link>
            </Button>
          </div>
          <dl className="mt-2 flex gap-8 text-sm">
            <div>
              <dt className="text-muted-foreground">Rated</dt>
              <dd className="font-display text-lg">4.9 / 5</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Delivery</dt>
              <dd className="font-display text-lg">Free over £75</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Returns</dt>
              <dd className="font-display text-lg">30 days</dd>
            </div>
          </dl>
        </div>

        <div className="relative">
          <div className="relative aspect-[3/2] overflow-hidden rounded-xl bg-paper shadow-sm">
            <Image
              src="/image/campaign/four-women.jpeg"
              alt="Four friends wearing Flossy Wears scripture crewnecks — Believes, Hope, Faith and God Is Within Her"
              fill
              priority
              sizes="(min-width: 1024px) 55vw, 90vw"
              className="object-cover"
            />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/25 to-transparent" />
          </div>
          <div className="absolute -bottom-4 -left-4 hidden rounded-lg border border-border bg-paper px-4 py-3 shadow-sm sm:block">
            <p className="font-display text-sm">&ldquo;Faith you can wear.&rdquo;</p>
          </div>
        </div>
      </div>
    </section>
  );
}
