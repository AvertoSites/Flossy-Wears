import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/common/page-header";

export const metadata: Metadata = {
  title: "Our story",
  description:
    "Flossy Wears makes editorial faith apparel in the UK — heavyweight, considered, quietly bold.",
};

export default function AboutPage() {
  return (
    <>
      <PageHeader
        eyebrow="Same faith, bigger purpose"
        title="Our story"
        crumbs={[{ label: "Home", href: "/" }, { label: "Our story" }]}
      />
      <div className="container-page grid gap-12 py-14 lg:grid-cols-[1.4fr_1fr]">
        <div className="flex flex-col gap-4 text-sm leading-relaxed text-muted-foreground">
          <p className="text-base text-foreground">
            Flossy Wears started with a simple frustration: Christian clothing
            that felt like a compromise. Thin cotton, loud graphics, designs you&rsquo;d
            only wear to a youth group.
          </p>
          <p>
            We wanted the opposite — pieces cut from 400gsm heavyweight fleece,
            with prints considered enough to wear anywhere. Every design pairs a
            verse with a layout you&rsquo;d choose even without the words, so your faith
            leads the conversation rather than shouting over it.
          </p>
          <p>
            Everything is designed in the UK and cut-and-sewn in Portugal, then
            printed here. We drop in small collections — like{" "}
            <Link href="/collections/the-four">The Four</Link> — so each release
            gets the attention it deserves.
          </p>
          <p>
            The goal has never changed: faithwear that actually looks good, made
            to be lived in for years.
          </p>
          <div className="pt-2">
            <Button asChild>
              <Link href="/shop">Shop the line</Link>
            </Button>
          </div>
        </div>
        <div className="relative aspect-[4/5] overflow-hidden rounded-xl bg-cream">
          <Image
            src="/image/four-believes-styling-guide.jpeg"
            alt="One sweatshirt, many ways to wear it — Flossy Wears styling guide"
            fill
            sizes="(min-width: 1024px) 33vw, 90vw"
            className="object-cover"
          />
        </div>
      </div>
    </>
  );
}
