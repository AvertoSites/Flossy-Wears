# Flossy Wears — storefront

Editorial faith-apparel e-commerce front end. Next.js 16 (App Router, Turbopack),
React 19, Tailwind CSS v4, TypeScript.

## Getting started

```bash
npm install
cp .env.example .env.local   # optional — Stripe keys enable real checkout
npm run dev
```

- `npm run dev` — dev server
- `npm run build` — production build
- `npm run lint` — ESLint

## Admin panel

`/admin` (passcode: `flossy-admin`, or `ADMIN_PASSCODE`). Sidebar sections:
Dashboard, Orders, Products, Inventory, Customers, Discounts, Payments,
Reviews, Settings. Modals are used **only for confirmation** (refunds,
deletes) — every editor is inline on the page.

- **Orders → fulfillment & tracking**: set status, carrier, tracking number/URL
  and tick "email the customer" to push a tracking update. Customers see it at
  `/track` (order number + email) and in their account.
- **Payments**: Stripe balance + transactions; refunds are issued from an order
  (`stripe.refunds.create` when keyed, mock otherwise) and flip payment status.
- **Products**: inline price / compare-at / badges / visibility + per-variant
  stock grid. **Inventory** lists variants ≤ 4 units.
- **Discounts**: create / pause / delete percentage codes used at checkout.
- **Reviews**: publish / hide. **Settings**: store info, free-ship threshold,
  delivery methods.

Admin data lives in an in-memory store (`src/lib/server/store.ts`) seeded from
the fixtures and mutated via `/api/admin/*`. It persists for the server process
lifetime — swap `src/lib/api/admin.ts` for Firestore, keeping signatures.

## Architecture

| Area | Where |
| --- | --- |
| Routes | `src/app` — `(store)/` group carries the storefront chrome, `admin/` its own shell |
| UI primitives | `src/components/ui` (shadcn / Radix) |
| Feature components | `src/components/{layout,home,product,shop,cart,checkout,account,common}` |
| **Data access** | `src/lib/api` — the single import surface for all storefront data |
| Mock fixtures | `src/lib/data` (14 products, collections, reviews, demo account) |
| Client data hooks | `src/lib/queries` (TanStack Query over `/api/*` route handlers) |
| Global state | `src/lib/store` (Zustand: `cart`, `wishlist`, `auth`, `recently-viewed`, `ui`) |
| Validation | `src/lib/validations` (Zod) |
| Types | `src/types` |

### Data layer / Firebase swap

Every page and hook imports from `@/lib/api` only. The modules there currently
return in-memory fixtures. To move to Firebase, reimplement the modules in
`src/lib/api` (Firestore reads, Firebase Auth, a Cloud Function for checkout)
keeping the same function signatures — no component changes required.
`src/lib/store/auth.ts` is the mock-auth seam.

### Payments

`/api/checkout` creates a Stripe Checkout Session when `STRIPE_SECRET_KEY` is
set, otherwise it returns a mock success URL so the flow is demoable offline.
Brand is UK: prices in GBP (`en-GB`), UK sizing and shipping copy.

## Brand

Gold `#C8A44D` · deep navy `#1E3A5F` · warm cream `#F1EADB`. Light mode only.
Tokens in `src/app/globals.css`; display font Fraunces, body Geist.

## Not yet wired

Firebase backend, real Stripe keys + webhook + order persistence, real
inventory, transactional email, i18n. Product photography beyond the 5 supplied
campaign images (fixtures flag `needsPhotography`).
