import Stripe from "stripe";
import { site } from "@/lib/data/site";
import { SHIPPING_METHODS } from "@/lib/constants";
import type { CreateCheckoutInput } from "@/lib/api/checkout";

/**
 * Creates a Stripe Checkout Session when STRIPE_SECRET_KEY is configured.
 * Without keys it returns a mock success URL so the flow is demoable offline.
 */
export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as CreateCheckoutInput | null;

  if (!body || !Array.isArray(body.lines) || body.lines.length === 0) {
    return Response.json({ error: "Empty basket" }, { status: 400 });
  }

  const origin =
    request.headers.get("origin") ??
    process.env.NEXT_PUBLIC_SITE_URL ??
    site.url;

  const method =
    SHIPPING_METHODS.find((m) => m.id === body.shippingMethodId) ??
    SHIPPING_METHODS[0];

  const secret = process.env.STRIPE_SECRET_KEY;

  if (!secret) {
    return Response.json({
      url: `${origin}/checkout/success?mock=1`,
      mock: true,
    });
  }

  const stripe = new Stripe(secret);

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    currency: "gbp",
    line_items: body.lines.map((line) => ({
      quantity: line.quantity,
      price_data: {
        currency: "gbp",
        unit_amount: line.price,
        product_data: { name: line.name },
      },
    })),
    shipping_options: [
      {
        shipping_rate_data: {
          type: "fixed_amount",
          display_name: method.label,
          fixed_amount: { amount: method.price, currency: "gbp" },
        },
      },
    ],
    customer_email: body.email,
    success_url: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/checkout`,
  });

  return Response.json({ url: session.url, mock: false });
}
