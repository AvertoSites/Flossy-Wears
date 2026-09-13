import type { Metadata } from "next";
import { searchProducts } from "@/lib/api";
import { PageHeader } from "@/components/common/page-header";
import { ProductGrid } from "@/components/product/product-grid";
import { EmptyState } from "@/components/common/empty-state";
import { pluralise } from "@/lib/format";

export const metadata: Metadata = {
  title: "Search",
  robots: { index: false },
};

export default async function SearchPage({
  searchParams,
}: PageProps<"/search">) {
  const { q } = await searchParams;
  const query = typeof q === "string" ? q : "";
  const results = query ? await searchProducts(query, 24) : [];

  return (
    <>
      <PageHeader
        eyebrow="Search"
        title={query ? `Results for “${query}”` : "Search"}
        description={
          query
            ? `${results.length} ${pluralise(results.length, "product")} found`
            : "Search verses, styles and colours."
        }
        crumbs={[{ label: "Home", href: "/" }, { label: "Search" }]}
      />
      <div className="container-page py-12">
        {query && results.length === 0 ? (
          <EmptyState
            title={`Nothing matched “${query}”`}
            description="Try a different word — a verse, a colour, or a style."
            action={{ label: "Browse all", href: "/shop" }}
          />
        ) : (
          <ProductGrid products={results} />
        )}
      </div>
    </>
  );
}
