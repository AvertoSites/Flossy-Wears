import type { NextRequest } from "next/server";
import { searchProducts } from "@/lib/api";

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q") ?? "";
  const items = await searchProducts(query, 6);
  return Response.json({ items }, { headers: { "cache-control": "no-store" } });
}
