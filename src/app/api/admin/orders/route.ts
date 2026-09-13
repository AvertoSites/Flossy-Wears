import type { NextRequest } from "next/server";
import { listOrders } from "@/lib/api/admin";

export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams;
  const orders = await listOrders({
    status: sp.get("status") ?? undefined,
    q: sp.get("q") ?? undefined,
  });
  return Response.json({ orders }, { headers: { "cache-control": "no-store" } });
}
