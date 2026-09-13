import { getPaymentsOverview } from "@/lib/api/admin";

export async function GET() {
  const overview = await getPaymentsOverview();
  return Response.json(overview, { headers: { "cache-control": "no-store" } });
}
