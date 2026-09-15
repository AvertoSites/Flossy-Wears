import { getOrderById, updateFulfillment } from "@/lib/api/admin";
import { withAdmin } from "@/lib/server/require-admin";
import { getRoyalMailTracking } from "@/lib/royal-mail/client";

/** Admin action: pull the latest Royal Mail tracking events onto the order's timeline. */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  return withAdmin(request, async () => {
    const { id } = await params;
    const order = await getOrderById(id);
    if (!order) return Response.json({ error: "Not found" }, { status: 404 });
    if (order.carrier !== "Royal Mail" || !order.trackingNumber) {
      return Response.json(
        { error: "Order has no Royal Mail tracking number" },
        { status: 400 },
      );
    }

    const tracking = await getRoyalMailTracking(order.trackingNumber);
    if (!tracking) {
      return Response.json({ error: "No tracking data found yet" }, { status: 404 });
    }

    const updated = await updateFulfillment(id, {
      trackingUrl: `https://www.royalmail.com/track-your-item#/tracking-results/${order.trackingNumber}`,
    });
    return Response.json({ order: updated, status: tracking.status, events: tracking.events });
  });
}
