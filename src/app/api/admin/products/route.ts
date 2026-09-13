import { listAdminProducts } from "@/lib/api/admin";

export async function GET() {
  const products = await listAdminProducts();
  return Response.json({ products }, { headers: { "cache-control": "no-store" } });
}
