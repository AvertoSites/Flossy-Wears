import {
  addOrderNote,
  getOrderById,
  updateFulfillment,
} from "@/lib/api/admin";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const order = await getOrderById(id);
  if (!order) return Response.json({ error: "Not found" }, { status: 404 });
  return Response.json({ order }, { headers: { "cache-control": "no-store" } });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;

  if (typeof body.note === "string" && body.note.trim()) {
    const order = await addOrderNote(id, body.note.trim());
    if (!order) return Response.json({ error: "Not found" }, { status: 404 });
    return Response.json({ order });
  }

  const order = await updateFulfillment(id, {
    status: body.status as never,
    carrier: body.carrier as string | undefined,
    trackingNumber: body.trackingNumber as string | undefined,
    trackingUrl: body.trackingUrl as string | undefined,
    notifyCustomer: Boolean(body.notifyCustomer),
  });
  if (!order) return Response.json({ error: "Not found" }, { status: 404 });
  return Response.json({ order });
}
