import { listLowStock } from "@/lib/api/admin";

export async function GET() {
  const rows = await listLowStock(4);
  return Response.json({ rows }, { headers: { "cache-control": "no-store" } });
}
