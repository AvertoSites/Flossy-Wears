import "server-only";

import { unstable_cache } from "next/cache";
import { adminDb } from "@/lib/firebase/admin";
import type { Collection } from "@/types";

const getAllCollectionsCached = unstable_cache(
  async (): Promise<Collection[]> => {
    const snap = await adminDb.collection("collections").get();
    return snap.docs.map((d) => d.data() as Collection);
  },
  ["collections:all"],
  { revalidate: 300, tags: ["collections"] },
);

export async function getCollections(): Promise<Collection[]> {
  return getAllCollectionsCached();
}

export async function getFeaturedCollections(): Promise<Collection[]> {
  const all = await getAllCollectionsCached();
  return all.filter((c) => c.featured);
}

export async function getCollection(slug: string): Promise<Collection | null> {
  const all = await getAllCollectionsCached();
  return all.find((c) => c.slug === slug) ?? null;
}

export async function getCollectionSlugs(): Promise<string[]> {
  const all = await getAllCollectionsCached();
  return all.map((c) => c.slug);
}
