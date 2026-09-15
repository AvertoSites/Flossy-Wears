import { listLowStock } from "@/lib/api/admin";
import { withAdmin } from "@/lib/server/require-admin";

export async function GET(request: Request) {
  return withAdmin(request, async () => {
    const rows = await listLowStock(4);
    return Response.json({ rows }, { headers: { "cache-control": "no-store" } });
  });
}
