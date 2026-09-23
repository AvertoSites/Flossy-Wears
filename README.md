# Flossy Wears — storefront

Editorial faith-apparel e-commerce front end. Next.js 16 (App Router, Turbopack),
React 19, Tailwind CSS v4, TypeScript — backed by **Firebase** (Auth, Firestore,
Cloud Functions) and **Stripe**.

## Getting started (local dev)

```bash
npm install
cp .env.example .env.local   # fill in Firebase + Firebase Admin values — see checklist below
npm run dev
```

- `npm run dev` — dev server
- `npm run build` — production build
- `npm run lint` — ESLint
- `npm run seed` — one-time push of the real product/collection/settings/discount data into Firestore (needs `FIREBASE_SERVICE_ACCOUNT_KEY` in `.env.local`)

## First-time setup checklist

The app is fully wired to real Firebase + Stripe — there is no mock/demo mode
left. Nothing works end-to-end until these are done, in order:

1. **Firestore + Auth** already exist for this project (`.env` already has the
   web app config). If you're setting this up on a fresh Firebase project,
   enable **Firestore Database** and **Authentication → Email/Password** in
   the Firebase Console first.
2. **Deploy security rules & indexes**: `firebase deploy --only firestore,storage`
   (uses `firestore.rules` + `firestore.indexes.json` + `storage.rules`).
   Nothing is readable/writable until this runs — the rules are the real
   access-control boundary, not the app's UI.
3. **Service account key** (for the Next.js server + seed script): Firebase
   Console → Project settings → Service accounts → Generate new private key.
   Minify the downloaded JSON to one line and set it as
   `FIREBASE_SERVICE_ACCOUNT_KEY` in `.env.local`. Never commit it.
4. **Seed the catalog**: `npm run seed` — pushes products, collections,
   settings and the two promo codes into Firestore. Safe to re-run.
5. **Enable Firebase's Blaze (pay-as-you-go) plan** — required for Cloud
   Functions to deploy at all (has a generous free tier for this scale).
6. **Stripe keys as Functions secrets** (never in `.env` — the secret key only
   ever lives here):
   ```bash
   firebase functions:secrets:set STRIPE_SECRET_KEY
   firebase functions:secrets:set STRIPE_WEBHOOK_SECRET   # from step 8
   ```
7. **Deploy the Cloud Functions**: `cd functions && npm install && cd .. && firebase deploy --only functions`.
   This deploys `createCheckoutSession`, `confirmCheckoutSession`, `stripeWebhook`, `refundOrder`.
8. **Register the Stripe webhook**: in the Stripe Dashboard, add an endpoint
   pointing at the deployed `stripeWebhook` function's URL (shown after step 7
   deploys), subscribed to `checkout.session.completed`,
   `checkout.session.async_payment_succeeded`, and
   `checkout.session.async_payment_failed`. Copy its signing secret into step 6.
   For local testing instead, use the Stripe CLI: `stripe listen --forward-to <function-url>`.
9. **Make yourself an admin**: create your Firebase Auth user in the Console
   (or register normally on the storefront), then manually add/edit that
   uid's `users/{uid}` Firestore document to set `role: "admin"`. There's no
   self-service path to admin, by design.
10. **(Optional) Royal Mail tracking**: set `ROYAL_MAIL_TRACKING_CLIENT_ID` /
    `ROYAL_MAIL_TRACKING_CLIENT_SECRET` (from developer.royalmail.net) to
    enable the admin order page's "Refresh tracking" button. Shipment/label
    creation (Click & Drop) isn't wired up — see `src/lib/royal-mail/client.ts`.
11. **(Optional) Customer tracking-update emails**: set `RESEND_API_KEY` (from
    resend.com) — and `RESEND_FROM_EMAIL` once you've verified a sending
    domain there — so the admin order page's "email the customer" checkbox
    actually sends. Without it, that action still records what would have
    been sent but skips the real send. `RESEND_FROM_EMAIL` here is a Next.js
    env var (`.env.local` / your hosting provider's env settings) — it only
    affects tracking-update emails.
    Order-confirmation emails are sent separately, from the `fulfillOrder`
    Cloud Function (`functions/src/email.ts`), which has its own
    `RESEND_FROM_EMAIL` string param (defaults to `onboarding@resend.dev`).
    `firebase functions:config` is deprecated, so set it by adding it to
    `functions/.env` (or `functions/.env.<project-id>`) as
    `RESEND_FROM_EMAIL="Flossy Wears <orders@yourdomain.com>"` and redeploy
    functions. Until this is set to an address on your verified domain, order
    confirmation emails will keep failing for every recipient except your own
    Resend account email (Resend's 403 on `onboarding@resend.dev`).

Test with a real (test-mode) checkout using card `4242 4242 4242 4242`, any
future expiry, any CVC.

## Admin panel

`/admin` — sign in with an account whose `users/{uid}.role == "admin"` (see
step 9 above). Every `/api/admin/*` route verifies that Firebase ID token
server-side (`src/lib/server/require-admin.ts`) — this is real auth now, not
a UI-only gate. Sidebar sections: Dashboard, Orders, Products, Inventory,
Customers, Discounts, Payments, Reviews, Settings.

- **Orders → fulfillment & tracking**: set status, carrier, tracking number/URL
  and tick "email the customer" to send a real tracking-update email (Resend —
  needs `RESEND_API_KEY`, see below; the timeline records whether it actually
  sent). Customers see live delivery progress at `/track` (order number +
  email, rate-limited) and on their own order page in `/account/orders`.
- **Payments**: real Stripe balance + transactions; refunds go through the
  `refundOrder` Cloud Function (admin-role-checked) and flip payment status.
- **Products**: full create/edit — name, description, verse, type, category,
  collections, pricing, colours/sizes with a per-variant stock grid, badges,
  visibility, and photo upload (Firebase Storage, admin-only writes, public
  reads — see `storage.rules`). **Inventory** lists variants ≤ 4 units.
- **Discounts**: create / pause / delete percentage codes — applied for real
  by `createCheckoutSession`, not just cosmetic.
- **Reviews**: publish / hide reviews customers submit from the product page.
  **Settings**: store info, free-ship threshold, delivery methods — the
  storefront actually reads these now (`settings/store` in Firestore).

## Architecture

| Area | Where |
| --- | --- |
| Routes | `src/app` — `(store)/` group carries the storefront chrome, `admin/` its own shell |
| UI primitives | `src/components/ui` (shadcn / Radix) |
| Feature components | `src/components/{layout,home,product,shop,cart,checkout,account,common}` |
| **Public data access** | `src/lib/api` — Firestore reads via `firebase-admin`, server-only |
| **Customer-specific data** | `src/lib/firebase/{orders,addresses,reviews}.ts` — client Firestore SDK, scoped by `firestore.rules` |
| **Payments/fulfillment** | `functions/` — Firebase Cloud Functions (Stripe webhook, checkout session, refunds) |
| Catalog seed source | `src/lib/data` (fixtures — only imported by `scripts/seed-firestore.ts` now) |
| Client data hooks | `src/lib/queries` (TanStack Query over `/api/*` route handlers) |
| Global state | `src/lib/store` (Zustand: `cart`, `wishlist`, `auth`, `recently-viewed`, `ui`) |
| Validation | `src/lib/validations` (Zod) |
| Types | `src/types` |

### Payments & fulfillment

Checkout requires a signed-in, verified account. `createCheckoutSession`
(Cloud Function) re-prices the cart from Firestore, never trusts the client,
and pre-creates the order (`paymentStatus: "pending"`). `stripeWebhook`
finalizes it on `checkout.session.completed` / `async_payment_succeeded`,
following [Stripe's documented fulfillment pattern](https://docs.stripe.com/checkout/fulfillment) —
idempotent, safe against retried/duplicate webhook deliveries, and also
triggered immediately from `/checkout/success` for fast UX. See
`docs/backend-plan.md` for the full design rationale.

Brand is UK: prices in GBP (`en-GB`), UK sizing and shipping copy.

## Brand

Gold `#C8A44D` · deep navy `#1E3A5F` · warm cream `#F1EADB`. Light mode only.
Tokens in `src/app/globals.css`; display font Fraunces, body Geist.

## Not yet wired

Royal Mail Click & Drop (shipment/label creation — needs a business contract
account, see `src/lib/royal-mail/client.ts`), Firebase App Check on public
writes (reviews/order-tracking abuse hardening), a branded order-confirmation
email at checkout (fulfillment/tracking update emails are wired via Resend —
see above — but the "your order is confirmed" email still relies on Stripe's
own receipt), i18n. Product photography beyond the 5 supplied campaign images
(fixtures flag `needsPhotography`) — admins can now upload real photos per
product from `/admin/products`.
