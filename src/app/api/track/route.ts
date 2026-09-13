import { getStore } from "@/lib/server/store";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as {
    orderNumber?: string;
    email?: string;
  } | null;

  const orderNumber = body?.orderNumber?.trim().toUpperCase();
  const email = body?.email?.trim().toLowerCase();

  if (!orderNumber || !email) {
    return Response.json(
      { error: "Enter your order number and email." },
      { status: 400 },
    );
  }

  const order = getStore().orders.find(
    (o) =>
      o.number.toUpperCase() === orderNumber &&
      o.customerEmail?.toLowerCase() === email,
  );

  if (!order) {
    return Response.json(
      { error: "We couldn't find an order with those details." },
      { status: 404 },
    );
  }

  return Response.json({
    number: order.number,
    status: order.status,
    placedAt: order.placedAt,
    carrier: order.carrier ?? null,
    trackingNumber: order.trackingNumber ?? null,
    trackingUrl: order.trackingUrl ?? null,
    shippedAt: order.shippedAt ?? null,
    deliveredAt: order.deliveredAt ?? null,
    lines: order.lines.map((l) => ({
      name: l.name,
      colourLabel: l.colourLabel,
      size: l.size,
      quantity: l.quantity,
      image: l.image,
    })),
    timeline: (order.timeline ?? []).filter((e) =>
      ["placed", "fulfillment", "refund"].includes(e.kind),
    ),
  });
}
