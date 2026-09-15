import { getStoreSettings } from "@/lib/api/settings";

/** Public — the storefront's client components (free-shipping bar, checkout) need this without a server round-trip per page. */
export async function GET() {
  const settings = await getStoreSettings();
  return Response.json({ settings });
}
