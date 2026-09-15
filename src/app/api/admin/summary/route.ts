import { getAdminSummary } from "@/lib/api/admin";
import { withAdmin } from "@/lib/server/require-admin";

export async function GET(request: Request) {
  return withAdmin(request, async () => {
    const summary = await getAdminSummary();
    return Response.json(summary, { headers: { "cache-control": "no-store" } });
  });
}
