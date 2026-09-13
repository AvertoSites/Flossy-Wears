import { collections, getCollectionBySlug } from "@/lib/data/collections";
import type { Collection } from "@/types";

export async function getCollections(): Promise<Collection[]> {
  return collections;
}

export async function getFeaturedCollections(): Promise<Collection[]> {
  return collections.filter((c) => c.featured);
}

export async function getCollection(slug: string): Promise<Collection | null> {
  return getCollectionBySlug(slug) ?? null;
}

export async function getCollectionSlugs(): Promise<string[]> {
  return collections.map((c) => c.slug);
}
