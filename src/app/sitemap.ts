import type { MetadataRoute } from "next";
import { getCollectionSlugs, getProductSlugs } from "@/lib/api";
import { site } from "@/lib/data/site";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [productSlugs, collectionSlugs] = await Promise.all([
    getProductSlugs(),
    getCollectionSlugs(),
  ]);

  const staticPaths = [
    "",
    "/shop",
    "/the-four",
    "/about",
    "/sizing",
    "/shipping-returns",
    "/faq",
  ];

  const now = new Date();

  return [
    ...staticPaths.map((path) => ({
      url: `${site.url}${path}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: path === "" ? 1 : 0.7,
    })),
    ...collectionSlugs.map((slug) => ({
      url: `${site.url}/collections/${slug}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    })),
    ...productSlugs.map((slug) => ({
      url: `${site.url}/products/${slug}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
  ];
}
