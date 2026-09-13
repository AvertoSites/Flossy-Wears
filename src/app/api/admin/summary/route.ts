import { getAdminSummary } from "@/lib/api/admin";

export async function GET() {
  const summary = await getAdminSummary();
  return Response.json(summary, { headers: { "cache-control": "no-store" } });
}
