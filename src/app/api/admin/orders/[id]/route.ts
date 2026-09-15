import {
  addOrderNote,
  getOrderById,
  updateFulfillment,
} from "@/lib/api/admin";
import { withAdmin } from "@/lib/server/require-admin";
import type { OrderStatus } from "@/types";

const ORDER_STATUSES: OrderStatus[] = [
  "processing",
  "packed",
  "shipped",
  "delivered",
  "cancelled",
];

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  return withAdmin(request, async () => {
    const { id } = await params;
    const order = await getOrderById(id);
    if (!order) return Response.json({ error: "Not found" }, { status: 404 });
    return Response.json({ order }, { headers: { "cache-control": "no-store" } });
  });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  return withAdmin(request, async () => {
    const { id } = await params;
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;

    if (typeof body.note === "string" && body.note.trim()) {
      const order = await addOrderNote(id, body.note.trim());
      if (!order) return Response.json({ error: "Not found" }, { status: 404 });
      return Response.json({ order });
    }

    if (body.status !== undefined && !ORDER_STATUSES.includes(body.status as OrderStatus)) {
      return Response.json({ error: "Invalid status" }, { status: 400 });
    }

    const order = await updateFulfillment(id, {
      status: body.status as OrderStatus | undefined,
      carrier: typeof body.carrier === "string" ? body.carrier : undefined,
      trackingNumber:
        typeof body.trackingNumber === "string" ? body.trackingNumber : undefined,
      trackingUrl: typeof body.trackingUrl === "string" ? body.trackingUrl : undefined,
      notifyCustomer: Boolean(body.notifyCustomer),
    });
    if (!order) return Response.json({ error: "Not found" }, { status: 404 });
    return Response.json({ order });
  });
}
