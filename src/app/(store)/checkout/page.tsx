import type { Metadata } from "next";
import { CheckoutGate } from "@/components/checkout/checkout-gate";
import { CheckoutView } from "@/components/checkout/checkout-view";

export const metadata: Metadata = {
  title: "Checkout",
  robots: { index: false },
};

export default function CheckoutPage() {
  return (
    <CheckoutGate>
      <CheckoutView />
    </CheckoutGate>
  );
}
