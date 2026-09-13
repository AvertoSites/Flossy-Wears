import { getCustomerByEmail } from "@/lib/api/admin";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ email: string }> },
) {
  const { email } = await params;
  const data = await getCustomerByEmail(decodeURIComponent(email));
  if (!data) return Response.json({ error: "Not found" }, { status: 404 });
  return Response.json(data, { headers: { "cache-control": "no-store" } });
}
