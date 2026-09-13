import Image from "next/image";
import Link from "next/link";
import { SectionHeading } from "@/components/common/section-heading";
import type { Collection } from "@/types";

export function CollectionTiles({ collections }: { collections: Collection[] }) {
  return (
    <section className="container-page py-16">
      <SectionHeading
        eyebrow="Shop by collection"
        title="Find your fit"
        className="mb-8"
      />
      <div className="grid gap-4 sm:grid-cols-3">
        {collections.slice(0, 3).map((collection) => (
          <Link
            key={collection.id}
            href={`/collections/${collection.slug}`}
            className="group relative flex aspect-[3/4] flex-col justify-end overflow-hidden rounded-xl bg-cream p-6"
          >
            <Image
              src={collection.heroImage}
              alt=""
              fill
              sizes="(min-width: 640px) 30vw, 90vw"
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <span className="absolute inset-0 bg-linear-to-t from-navy/75 via-navy/10 to-transparent" />
            <div className="relative text-primary-foreground">
              <p className="text-xs uppercase tracking-[0.2em] text-primary-foreground/80">
                {collection.eyebrow}
              </p>
              <p className="font-display text-2xl">{collection.name}</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
