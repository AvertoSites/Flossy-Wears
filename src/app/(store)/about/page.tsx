import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/common/page-header";

export const metadata: Metadata = {
  title: "About Flossy Wears",
  description:
    "Faith you can wear, every day. Flossy Wears turns Scripture and heritage into wearable, everyday clothing designed with purpose — from crewnecks and African print hoodies to hooded maxi dresses and Christmas jumpers.",
};

const OUR_COLLECTIONS = [
  {
    name: "The Four",
    href: "/collections/the-four",
    image: "/image/campaign/four-campaign-cover.jpeg",
    copy: "Where it began — four verses on four heavyweight crewnecks: Hope, Faith, Her and Believes.",
  },
  {
    name: "African Heritage Prints",
    href: "/collections/african-prints",
    image: "/image/african-print-hoodies/africa-circle-hoodie-red-women.jpeg",
    copy: "Hoodies carrying the shape of the continent in vibrant wax print — a proud nod to where we come from.",
  },
  {
    name: "Hooded Maxi Dresses",
    href: "/collections/hoodie-dresses",
    image: "/image/hoodie-dresses/hooded-maxi-dress-burgundy-front-back.jpeg",
    copy: "Modest, floor-length and endlessly comfortable — the ease of a hoodie with the grace of a dress.",
  },
  {
    name: "The Christmas Edit",
    href: "/collections/christmas-jumpers",
    image: "/image/christmas-jumpers/reason-for-the-season-jumper-women-white.jpeg",
    copy: "Festive jumpers with one message at their heart: Jesus is the reason for the season.",
  },
];

export default function AboutPage() {
  return (
    <>
      <PageHeader
        eyebrow="Faith you can wear. Every day."
        title="About Flossy Wears"
        crumbs={[{ label: "Home", href: "/" }, { label: "About" }]}
      />

      <div className="container-page grid gap-12 py-14 lg:grid-cols-[1.4fr_1fr]">
        <div className="flex flex-col gap-4 text-sm leading-relaxed text-muted-foreground">
          <p className="text-base text-foreground">
            Flossy Wears was created from a simple belief: faith should not
            only be something we believe — it can be something we carry,
            express and wear.
          </p>
          <p>
            Our clothing is designed for women and men who want to express
            their faith with confidence while still looking stylish,
            comfortable and effortlessly modern.
          </p>
          <p>
            Every piece is inspired by Scripture and created with purpose.
            From &ldquo;God is within her&rdquo; to &ldquo;Blessed is she
            that believes&rdquo;, our designs turn powerful biblical truths
            into wearable reminders of who we are and what we believe.
          </p>
          <p>
            What started with four Scripture crewnecks has grown into a wider
            family of collections. Alongside our verses, we now celebrate our
            African heritage, offer modest hooded maxi dresses for everyday
            elegance, and bring the true meaning of Christmas to the festive
            season — each one made with the same purpose at its heart.
          </p>
          <div className="pt-2">
            <Button asChild>
              <Link href="/shop">Shop the line</Link>
            </Button>
          </div>
        </div>
        <div className="relative aspect-[4/5] overflow-hidden rounded-xl bg-cream">
          <Image
            src="/image/believes/four-believes-styling-guide.jpeg"
            alt="One sweatshirt, many ways to wear it — Flossy Wears styling guide"
            fill
            sizes="(min-width: 1024px) 33vw, 90vw"
            className="object-cover"
          />
        </div>
      </div>

      <div className="border-t border-border bg-cream">
        <div className="container-page grid gap-12 py-14 lg:grid-cols-2">
          <div className="flex flex-col gap-4">
            <h2 className="font-display text-2xl">More Than Clothing</h2>
            <div className="flex flex-col gap-4 text-sm leading-relaxed text-muted-foreground">
              <p>
                Flossy Wears is about more than creating sweatshirts, hoodies
                and dresses. It is about creating pieces that can speak
                when words are difficult to find.
              </p>
              <p>
                Whether you are heading to work, meeting friends, running
                errands, attending church or simply enjoying a quiet day, our
                hope is that every Flossy Wears piece reminds you to walk
                boldly in your faith.
              </p>
              <p>
                We believe clothing can carry a message, start a conversation
                and encourage someone — including the person wearing it.
              </p>
            </div>
          </div>
          <div className="flex flex-col gap-4">
            <h2 className="font-display text-2xl">Faith. Style. Purpose.</h2>
            <div className="flex flex-col gap-4 text-sm leading-relaxed text-muted-foreground">
              <p>
                Our collections bring together faith-inspired messages,
                contemporary design and everyday comfort. Each piece is
                thoughtfully created to be versatile enough for everyday
                life while keeping its message at the heart of the design.
              </p>
              <p className="text-base text-foreground">
                Wear your faith. Carry the message. Live with purpose.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="container-page py-14">
        <div className="mb-8 flex flex-col gap-2">
          <span className="text-xs font-medium uppercase tracking-[0.24em] text-gold-dark">
            One purpose, many expressions
          </span>
          <h2 className="font-display text-2xl">Our Collections</h2>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {OUR_COLLECTIONS.map((c) => (
            <Link key={c.href} href={c.href} className="group flex flex-col gap-3">
              <div className="relative aspect-[3/4] overflow-hidden rounded-xl bg-cream">
                <Image
                  src={c.image}
                  alt={c.name}
                  fill
                  sizes="(min-width: 1024px) 22vw, (min-width: 640px) 45vw, 90vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </div>
              <p className="font-display text-lg">{c.name}</p>
              <p className="text-sm leading-relaxed text-muted-foreground">{c.copy}</p>
            </Link>
          ))}
        </div>
      </div>

      <div className="container-page flex flex-col items-center gap-4 border-t border-border py-16 text-center">
        <h2 className="font-display text-3xl">Welcome to Flossy Wears.</h2>
        <p className="max-w-xl text-muted-foreground">
          Faith you can wear. Every day.
        </p>
        <Button asChild size="lg" className="mt-2">
          <Link href="/shop">Shop the line</Link>
        </Button>
      </div>
    </>
  );
}
