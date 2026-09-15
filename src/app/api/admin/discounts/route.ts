import { createDiscount, listDiscounts } from "@/lib/api/admin";
import { withAdmin } from "@/lib/server/require-admin";

export async function GET(request: Request) {
  return withAdmin(request, async () => {
    const discounts = await listDiscounts();
    return Response.json(
      { discounts },
      { headers: { "cache-control": "no-store" } },
    );
  });
}

export async function POST(request: Request) {
  return withAdmin(request, async () => {
    const body = (await request.json().catch(() => ({}))) as {
      code?: string;
      percentOff?: number;
      label?: string;
    };
    if (!body.code || !body.percentOff) {
      return Response.json({ error: "Code and percentage required" }, { status: 400 });
    }
    const result = await createDiscount({
      code: body.code,
      percentOff: body.percentOff,
      label: body.label,
    });
    if ("error" in result) return Response.json(result, { status: 400 });
    return Response.json({ discount: result });
  });
}
