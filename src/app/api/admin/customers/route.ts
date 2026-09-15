import { listCustomers } from "@/lib/api/admin";
import { withAdmin } from "@/lib/server/require-admin";

export async function GET(request: Request) {
  return withAdmin(request, async () => {
    const customers = await listCustomers();
    return Response.json(
      { customers },
      { headers: { "cache-control": "no-store" } },
    );
  });
}
