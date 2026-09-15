import { getCustomerByEmail } from "@/lib/api/admin";
import { withAdmin } from "@/lib/server/require-admin";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ email: string }> },
) {
  return withAdmin(request, async () => {
    const { email } = await params;
    const data = await getCustomerByEmail(decodeURIComponent(email));
    if (!data) return Response.json({ error: "Not found" }, { status: 404 });
    return Response.json(data, { headers: { "cache-control": "no-store" } });
  });
}
