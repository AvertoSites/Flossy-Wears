import { getPaymentsOverview } from "@/lib/api/admin";
import { withAdmin } from "@/lib/server/require-admin";

export async function GET(request: Request) {
  return withAdmin(request, async () => {
    const overview = await getPaymentsOverview();
    return Response.json(overview, { headers: { "cache-control": "no-store" } });
  });
}
