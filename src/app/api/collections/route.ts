import { getCollections } from "@/lib/api/collections";

/** Public — used by the storefront's client hooks and the admin product form's collection picker. */
export async function GET() {
  const collections = await getCollections();
  return Response.json({ collections });
}
