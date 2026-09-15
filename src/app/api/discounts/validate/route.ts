import { adminDb } from "@/lib/firebase/admin";

/**
 * Public preview endpoint for the cart page's "Apply" promo box — lets a
 * shopper see the discount before checkout without exposing the full
 * `discounts` collection to clients (Firestore rules keep that admin-only,
 * to stop code enumeration). This is UX only: `createCheckoutSession`
 * re-validates and re-applies the code server-side regardless of what this
 * returns.
 */
export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    code?: string;
    subtotalPence?: number;
  };
  const code = body.code?.trim().toUpperCase();
  if (!code) return Response.json({ error: "Code is required" }, { status: 400 });

  const snap = await adminDb.collection("discounts").doc(code).get();
  if (!snap.exists || snap.data()?.active !== true) {
    return Response.json({ error: "That code isn't valid" }, { status: 404 });
  }

  const { label, percentOff } = snap.data() as { label: string; percentOff: number };
  const subtotal = typeof body.subtotalPence === "number" ? body.subtotalPence : 0;
  return Response.json({
    code,
    label,
    percentOff,
    discountPence: Math.round((subtotal * percentOff) / 100),
  });
}
