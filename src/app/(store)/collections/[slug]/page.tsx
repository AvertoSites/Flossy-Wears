import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import { getCollection, getCollectionSlugs } from "@/lib/api";
import { Breadcrumbs } from "@/components/common/breadcrumbs";
import { ShopView } from "@/components/shop/shop-view";

export async function generateStaticParams() {
  const slugs = await getCollectionSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/collections/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const collection = await getCollection(slug);
  if (!collection) return {};
  return {
    title: collection.name,
    description: collection.description,
  };
}

export default async function CollectionPage({
  params,
}: PageProps<"/collections/[slug]">) {
  const { slug } = await params;
  const collection = await getCollection(slug);
  if (!collection) notFound();

  return (
    <>
      <section className="relative overflow-hidden border-b border-border bg-navy text-primary-foreground">
        <Image
          src={collection.heroImage}
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover opacity-30"
        />
        <div className="container-page relative flex flex-col gap-4 py-16 sm:py-20">
          <Breadcrumbs
            items={[
              { label: "Home", href: "/" },
              { label: "Collections", href: "/collections/the-four" },
              { label: collection.name },
            ]}
          />
          {collection.eyebrow && (
            <span className="text-xs font-medium uppercase tracking-[0.24em] text-gold-light">
              {collection.eyebrow}
            </span>
          )}
          <h1 className="text-4xl text-primary-foreground sm:text-5xl">
            {collection.name}
          </h1>
          <p className="max-w-xl text-primary-foreground/80">
            {collection.description}
          </p>
        </div>
      </section>

      <Suspense fallback={<div className="container-page py-20" />}>
        <ShopView fixed={{ collection: slug }} />
      </Suspense>
    </>
  );
}
