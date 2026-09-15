# Backend Plan — Firebase + Stripe

Status: **implemented** (2026-09-13) — Firestore, Firebase Cloud Functions
(`functions/`), and the Stripe integration described below are built. What's
left is infrastructure the project owner must configure themselves (enabling
Firebase's Blaze plan, Stripe/Royal Mail API keys, running `npm run seed`,
deploying rules/functions) — not covered by this document. This file is kept
for the architectural rationale; §0's audit findings describe the state
*before* this pass, not the current codebase.
Currency: GBP only. Region: UK only.

This document is the reference for the backend rebuild. Section numbers are
stable — quote them as `backend-plan.md §3` etc. when discussing or tracking
work against this plan.

---

## 0. Current state (as of this audit)

The app is a fully-built Next.js frontend wired to a **fully mocked backend**.
Findings from a full pass over the codebase:

- **No order is ever created.** [`checkout-success-view.tsx`](../src/components/checkout/checkout-success-view.tsx)
  generates the order number with `Math.random()` and just clears the cart.
  Even with a live Stripe key, [`/api/checkout`](../src/app/api/checkout/route.ts)
  only opens a Checkout Session — there is no webhook route anywhere, so a
  successful payment never results in a stored order.
- **Checkout trusts the browser for price.** `/api/checkout` builds Stripe
  line items straight from whatever `price`/`quantity` the client cart sends;
  nothing re-checks that against the real product/variant price server-side.
- **Every `/api/admin/*` route is wide open.** ~~`/api/admin/login` checks
  one shared passcode~~ — **fixed for identity** (see §3: real Firebase Auth
  + a manually-set Firestore role replaced the passcode). The routes
  themselves (orders, products, refunds, settings, …) still check nothing
  server-side, so this exposure isn't fully closed until admin data moves
  into Firestore behind rules (§3 tradeoff, §8).
- **"Data" is one in-memory object** ([`server/store.ts`](../src/lib/server/store.ts)),
  reseeded with fake orders on process start and kept alive via `globalThis`.
  On serverless hosting (Vercel-style) this does not reliably persist across
  instances — today's "admin edits" are best-effort within a single warm
  instance.
- **Customer accounts are one hardcoded demo user** ([`account.ts`](../src/lib/api/account.ts),
  `amara@example.com`). Login/register pages don't create real accounts.
- **Contact form is fully fake** (`setTimeout` + toast, no request sent
  anywhere). Newsletter signup validates the email and goes nowhere (`// TODO(firebase)`
  in [`misc.ts`](../src/lib/validations/misc.ts) usage). Admin-created discount
  codes aren't wired into the real checkout total.
- **Refunds and the admin payments dashboard** are mock functions mutating
  the in-memory store, not real Stripe API calls.

The good news: this was built deliberately this way. `src/lib/api/*` is
already documented as a storage-agnostic barrel — "reimplement the modules
in this folder … keep signatures identical" — so most frontend components
should not need to change shape, only their data source.

`package.json` currently has `stripe` but neither `firebase` nor
`firebase-admin` installed.

---

## 1. Architecture overview

- Keep Next.js (App Router) as the frontend/BFF layer, deployed as today.
- **Firebase Auth** for both customer and admin identity.
- **Firestore** as the primary database, replacing `src/lib/server/store.ts`
  and the static fixtures in `src/lib/data/*` for anything mutable.
- **Cloud Functions** (or Next.js route handlers using `firebase-admin`,
  see §7) for privileged operations: checkout total recomputation, the
  Stripe webhook, refunds. (Admin *identity* no longer needs this — see §3,
  revised — but these operations still need a trusted server for the Stripe
  secret key regardless of how admin auth works.)
- **Stripe** stays the payment processor: Checkout Sessions for payment,
  webhooks as the source of truth for order creation, Refunds API for
  admin-issued refunds.
- **Firebase Storage**, if/when product imagery moves off static `/public`
  files and into an admin-managed upload flow.
- **Firebase App Check** on public-facing writes (see §5).

Currency/locale stays hardcoded GBP/`en-GB` throughout — no
multi-currency or tax-jurisdiction logic in this phase.

---

## 2. Data model (Firestore)

Mapped from the existing shapes in [`types/index.ts`](../src/types/index.ts).

| Collection | Notes |
|---|---|
| `products/{id}` | Variants embedded as an array field (catalog is small; no need for a subcollection yet). Includes `customizable`, `active`, badges, etc. as today. |
| `collections/{id}` | As today. |
| `reviews/{id}` | Customer-submitted, `status: "pending" \| "published"`. Only admin can flip status; customer can create but not self-publish. |
| `discounts/{code}` | Admin-managed. Checkout Cloud Function reads this to apply real discounts (currently disconnected from checkout — see §0). |
| `orders/{id}` | **Never client-writable.** Created only by the Stripe webhook function (§4). Customers get read-only access to their own orders; admins get full read/write. Includes `customerId` (Firebase Auth `uid`) for rules-based ownership checks, in addition to `customerEmail`. |
| `users/{uid}` | Profile fields; `addresses` as a subcollection. Owner-only read/write, admin read. |
| `carts/{uid}` | Optional — only needed if cart should persist across devices/sessions. Otherwise keep cart client-local (Zustand + localStorage) as today; simpler and fine for v1. |
| `settings/store` | Single doc: store name, support email, free-shipping threshold, shipping methods. Publicly readable, admin-writable. The storefront must actually read this at checkout time (today `SHIPPING_METHODS`/`site.freeShippingThreshold` are hardcoded constants the admin Settings page edits a copy of but checkout never reads — see §0). |

Indexes needed (composite): `orders` by `customerId` + `placedAt desc`;
`orders` by `status` + `placedAt desc` (admin order list filtering).

---

## 3. Auth design — **implemented** (revised from the original draft)

Decision: **no Firebase Admin SDK, no server for this app to run it on
anyway.** Roles are a plain `role` field on each user's Firestore
`users/{uid}` doc, enforced entirely by Firestore Security Rules
([`firestore.rules`](../firestore.rules)) rather than by a server verifying
custom claims. This is a deliberate simplification, not an oversight — see
the tradeoff note at the end of this section.

**Customers**
- Firebase Auth, email/password. Client SDK only
  ([`lib/firebase/client.ts`](../src/lib/firebase/client.ts)) — sign-up,
  sign-in and sign-out all happen directly from the browser.
- `useAuth` ([`store/auth.ts`](../src/lib/store/auth.ts)) is now a thin
  reactive container populated by `AuthListener`
  ([`components/providers/auth-listener.tsx`](../src/components/providers/auth-listener.tsx)),
  which subscribes to `onAuthStateChanged` and reads the matching
  `users/{uid}` Firestore doc.
- **Email verification is required.** Sign-up sends a verification email
  (`sendEmailVerification`); `AccountGate` redirects anyone signed in but
  unverified to `/account/verify-email` before they can reach `/account/*`.
- Session persists via `browserLocalPersistence` — signed-in state survives
  reloads and browser restarts, no repeated logins.
- A signed-up user's Firestore doc is always created with `role: "customer"`
  ([`createCustomerProfile`](../src/lib/firebase/user-doc.ts)) — the rules
  reject any client write that tries to set `role: "admin"`.

**Admin**
- No shared passcode, no custom claims. Admin accounts are **created and
  flagged manually**: she creates the Firebase Auth user in the Firebase
  Console, then manually creates/edits that uid's `users/{uid}` Firestore
  document to set `role: "admin"`. The app has no self-service path to
  admin, by design.
- `/admin/login` ([`page.tsx`](../src/app/admin/login/page.tsx)) signs in
  with Firebase Auth, reads the resulting `users/{uid}` doc, and only
  proceeds if `role == "admin"` — otherwise it signs the user back out.
- `AdminGate` ([`components/admin/admin-gate.tsx`](../src/components/admin/admin-gate.tsx))
  is a **UI-level** gate only (redirects based on the client's own read of
  `role`) — see the tradeoff below for what this does and doesn't secure.

**Tradeoff, stated plainly:** without Admin SDK, nothing server-side can
verify a Firebase ID token, so our own Next.js route handlers
(`/api/admin/*`) still cannot authenticate a caller — they remain exactly as
open as described in §0 until admin data actually moves into Firestore.
Once it does, Firestore Security Rules (checking the same `users/{uid}.role`
field, via `isAdmin()` in `firestore.rules`) become the real enforcement —
the same pattern already protecting the `users` collection today. Until that
migration, `AdminGate` and the admin-login role check are UX/routing
convenience, not a data security boundary — closing §0's admin exposure for
good is still gated on moving orders/products/etc. into Firestore (§8).

---

## 4. Checkout & payments

This needs re-architecting, not just a storage swap.

1. A server-side function recomputes the cart total from the real
   `products/{id}` documents (price, variant, stock) before creating the
   Stripe Checkout Session. Client-submitted prices are never trusted.
2. Add the **missing Stripe webhook endpoint**, verifying the Stripe
   signing secret. `checkout.session.completed` is what actually:
   - creates the `orders/{id}` document,
   - decrements variant stock transactionally,
   - triggers the confirmation email.
   Keyed on the Stripe session/payment-intent ID so retried webhook
   deliveries can't double-create an order (idempotency).
3. The `/checkout/success` page stops inventing an order number — it reads
   the real order (via session ID) once the webhook has landed, or shows a
   "confirming your payment" state if the webhook hasn't landed yet.
4. Refunds go through the real Stripe Refunds API from a server-side
   function and write the result back onto the Firestore order — replacing
   the current mock mutation in [`refund/route.ts`](../src/app/api/admin/orders/[id]/refund/route.ts).
   **Open question carried over from §3**: this function needs the Stripe
   secret key, so it must run server-side — and per §3's tradeoff, this app
   has no Admin-SDK-based way to verify the caller is an admin at that
   boundary. Needs a decision when this phase is built (candidates: bring
   Admin SDK back just for token verification, or another verified-server
   mechanism).
5. Discount codes: checkout function looks up `discounts/{code}` and applies
   it server-side to the recomputed total — fixing the current disconnect
   where admin-created codes never reach the real checkout math.

---

## 5. Security rules & abuse prevention

- Firestore rules: deny-by-default, then explicit per-collection allow
  rules per §2. No collection is broadly readable/writable by default.
- Firebase App Check on the web app and on callable functions, to cut down
  scripted abuse of public endpoints (contact form, newsletter signup,
  order tracking, promo code checks).
- Rate-limit the public order-tracking lookup (order number + email) —
  today it's an unauthenticated guessing endpoint
  ([`track/route.ts`](../src/app/api/track/route.ts)) with no throttling.
- Secrets (`STRIPE_SECRET_KEY`, Stripe webhook signing secret, any
  admin-provisioning credentials) live in Firebase Functions config /
  hosting env vars — never in the client bundle. Audit that `NEXT_PUBLIC_*`
  only ever holds the Stripe *publishable* key.

---

## 6. Efficiency

- Composite Firestore indexes per §2.
- Keep the product catalog on ISR/static generation as today rather than
  hitting Firestore on every storefront page load — Firestore is for what's
  actually dynamic (orders, stock, reviews), not for re-fetching the
  catalog per request.
- Keep Cloud Functions on the checkout/webhook path light (minimal SDK
  surface) to avoid cold-start latency at the moment that matters most.
- Precompute admin dashboard aggregates (revenue, order counts, low stock)
  via a scheduled function writing a summary doc, rather than scanning all
  orders on every admin page load.

---

## 7. Implementation seam: Cloud Functions vs. Next.js route handlers

Both options below assume Admin SDK is back in play for these specific
server-side operations (checkout total recompute, webhook, refunds) — §3's
"no Admin SDK" decision was scoped to *identity/role checks*, not to every
privileged operation. Two viable options for where this logic lives; pick
one per function rather than mixing without reason:

- **Next.js route handlers + `firebase-admin`** — simplest, keeps everything
  in one deploy, good fit for most of this (`/api/checkout`, `/api/admin/*`).
- **Firebase Cloud Functions** — better fit for the Stripe webhook
  specifically (independent scaling/retry semantics from Stripe's POV) and
  for scheduled jobs (§6 aggregates).

Recommendation: route handlers for everything except the Stripe webhook and
the scheduled aggregate job, which become Cloud Functions.

---

## 8. Migration order

Sequenced so nothing breaks mid-flight:

1. **Admin auth** — ✅ done (§3): real Firebase Auth + a manually-set
   Firestore `role` field, `/admin/login` and `AdminGate` check it. Still
   open: `/api/admin/*` routes themselves aren't server-verified (§3
   tradeoff) — closing that fully happens as part of step 2/3 below, once
   admin data lives in Firestore behind rules instead of these routes.
2. **Product/catalog read migration** — swap `src/lib/data` fixtures for
   Firestore reads behind the existing `src/lib/api` signatures.
3. **Checkout + webhook + order persistence** — the core functional gap
   (§4). Biggest single piece of work.
4. **Refunds, settings, reviews, discounts** wired to real Stripe/Firestore
   instead of the mock store.
5. **Contact form + newsletter** wired to a real destination (Firestore doc
   + email, or a forwarding service).
6. **Customer accounts** — real Firebase Auth sign-up/login, `/account/*`
   pages reading the signed-in user's real orders/addresses instead of the
   hardcoded demo customer.

---

## Open decisions

- Delivery fee model: parked for now, currently hardcoded to free on every
  method (see chat history / commit history around 2026-09-13). Revisit
  once real order volume exists.
- Whether cart persists server-side (`carts/{uid}`) or stays client-local —
  leaning client-local for v1 (§2).
- Content moderation / approval step for the "Customise Your Own" feature's
  free-text verse — not yet decided (see feature discussion; currently no
  moderation or review-step implemented).
