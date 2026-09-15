import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  getProduct,
  getProductSlugs,
  getRatingSummary,
  getRelatedProducts,
  getReviews,
} from "@/lib/api";
import { ProductPurchase } from "@/components/product/product-purchase";
import { ProductReviews } from "@/components/product/product-reviews";
import { ProductCarousel } from "@/components/product/product-carousel";
import { formatPrice } from "@/lib/format";
import { site } from "@/lib/data/site";

export async function generateStaticParams() {
  const slugs = await getProductSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/products/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) return {};
  return {
    title: product.name,
    description: `${product.tagline} ${product.verse.reference}. ${formatPrice(product.price.amount)}.`,
    openGraph: {
      title: `${product.name} · ${site.name}`,
      description: product.tagline,
      images: [{ url: product.images[0] }],
    },
  };
}

export default async function ProductPage({
  params,
}: PageProps<"/products/[slug]">) {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) notFound();

  const [reviews, summary, related] = await Promise.all([
    getReviews(product.id),
    getRatingSummary(product.id),
    getRelatedProducts(slug, 8),
  ]);

  return (
    <>
      <ProductPurchase product={product} />
      <ProductReviews productId={product.id} reviews={reviews} summary={summary} />
      {related.length > 0 && (
        <div className="border-t border-border">
          <ProductCarousel
            eyebrow="You may also like"
            title="Complete the look"
            products={related}
          />
        </div>
      )}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Product",
            name: product.name,
            description: product.tagline,
            brand: { "@type": "Brand", name: site.name },
            ...(summary.total > 0 && {
              aggregateRating: {
                "@type": "AggregateRating",
                ratingValue: summary.average,
                reviewCount: summary.total,
              },
            }),
            offers: {
              "@type": "Offer",
              priceCurrency: "GBP",
              price: (product.price.amount / 100).toFixed(2),
              availability: "https://schema.org/InStock",
            },
          }),
        }}
      />
    </>
  );
}
