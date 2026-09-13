import { refundOrder } from "@/lib/api/admin";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = (await request.json().catch(() => ({}))) as { amount?: number };
  const result = await refundOrder(id, body.amount);
  if (!result) return Response.json({ error: "Not found" }, { status: 404 });
  return Response.json(result);
}
