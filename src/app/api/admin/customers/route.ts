import { listCustomers } from "@/lib/api/admin";

export async function GET() {
  const customers = await listCustomers();
  return Response.json(
    { customers },
    { headers: { "cache-control": "no-store" } },
  );
}
