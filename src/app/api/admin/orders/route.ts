import type { NextRequest } from "next/server";
import { listOrders } from "@/lib/api/admin";
import { withAdmin } from "@/lib/server/require-admin";

export async function GET(request: NextRequest) {
  return withAdmin(request, async () => {
    const sp = request.nextUrl.searchParams;
    const orders = await listOrders({
      status: sp.get("status") ?? undefined,
      q: sp.get("q") ?? undefined,
    });
    return Response.json({ orders }, { headers: { "cache-control": "no-store" } });
  });
}
