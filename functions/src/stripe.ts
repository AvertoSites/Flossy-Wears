import { defineSecret, defineString } from "firebase-functions/params";
import Stripe from "stripe";

export const stripeSecretKey = defineSecret("STRIPE_SECRET_KEY");
export const stripeWebhookSecret = defineSecret("STRIPE_WEBHOOK_SECRET");
/** Falls back to a Firebase Hosting-style default if not set. Override with `firebase functions:config` / .env for the functions codebase. */
export const siteUrl = defineString("SITE_URL", {
  default: "https://flossywears.co.uk",
});

let cached: Stripe | null = null;

export function getStripe(): Stripe {
  if (cached) return cached;
  cached = new Stripe(stripeSecretKey.value());
  return cached;
}
