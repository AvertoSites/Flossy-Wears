import type { Metadata } from "next";
import { Suspense } from "react";
import { CheckoutSuccessView } from "@/components/checkout/checkout-success-view";

export const metadata: Metadata = {
  title: "Order confirmed",
  robots: { index: false },
};

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={<div className="container-page py-24" />}>
      <CheckoutSuccessView />
    </Suspense>
  );
}
