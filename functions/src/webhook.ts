import { onRequest } from "firebase-functions/v2/https";
import { logger } from "firebase-functions/v2";
import { getStripe, stripeSecretKey, stripeWebhookSecret } from "./stripe";
import { resendApiKey } from "./email";
import { fulfillCheckoutSession, markPaymentFailed } from "./fulfillment";

/**
 * Stripe webhook — the reliable source of truth for order fulfillment (see
 * https://docs.stripe.com/checkout/fulfillment: "webhooks are required...
 * you can't rely on triggering fulfillment only from your checkout landing
 * page"). Listens for both `checkout.session.completed` and
 * `checkout.session.async_payment_succeeded` — delayed payment methods
 * (bank transfers etc.) only reach "paid" on the latter event.
 *
 * Register this URL in the Stripe Dashboard (or `stripe listen` for local
 * testing) once deployed — see the final setup checklist.
 */
export const stripeWebhook = onRequest(
  { secrets: [stripeSecretKey, stripeWebhookSecret, resendApiKey] },
  async (req, res) => {
    const signature = req.headers["stripe-signature"];
    if (!signature || typeof signature !== "string") {
      res.status(400).send("Missing Stripe-Signature header");
      return;
    }

    let event;
    try {
      event = getStripe().webhooks.constructEvent(
        req.rawBody,
        signature,
        stripeWebhookSecret.value(),
      );
    } catch (err) {
      logger.error("Stripe webhook signature verification failed", err);
      res.status(400).send("Invalid signature");
      return;
    }

    try {
      switch (event.type) {
        case "checkout.session.completed":
        case "checkout.session.async_payment_succeeded": {
          const session = event.data.object as { id: string };
          await fulfillCheckoutSession(session.id);
          break;
        }
        case "checkout.session.async_payment_failed": {
          const session = event.data.object as { id: string };
          await markPaymentFailed(session.id);
          break;
        }
        default:
          break; // ignore anything we don't act on
      }
      res.status(200).send("ok");
    } catch (err) {
      logger.error(`Error handling Stripe event ${event.type}`, err);
      // Return 200 anyway once we've logged it — a permanent bug in our own
      // handler shouldn't make Stripe retry the same event forever.
      res.status(200).send("logged");
    }
  },
);
