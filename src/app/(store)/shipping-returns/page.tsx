import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/common/page-header";
import { Prose } from "@/components/common/prose";

export const metadata: Metadata = {
  title: "Shipping & returns",
  description: "UK delivery options, timings and the Flossy Wears 30-day returns policy.",
};

export default function ShippingReturnsPage() {
  return (
    <>
      <PageHeader
        title="Shipping & returns"
        crumbs={[{ label: "Home", href: "/" }, { label: "Shipping & returns" }]}
      />
      <div className="container-page py-14">
        <Prose>
          <h2>UK delivery</h2>
          <ul>
            <li>
              <strong>Free delivery</strong> on all orders over £75.
            </li>
            <li>
              <strong>Standard</strong> — £3.95, Royal Mail Tracked 48, 2–4 working
              days.
            </li>
            <li>
              <strong>Express</strong> — £5.95, Royal Mail Tracked 24, 1–2 working
              days.
            </li>
            <li>
              <strong>Studio collection</strong> — free, ready within 24 hours from
              Peckham Levels, London.
            </li>
          </ul>
          <p>
            Orders placed before 1pm on a working day are dispatched the same day.
            You&rsquo;ll get a tracking link by email as soon as your parcel is on its
            way.
          </p>

          <h2>International</h2>
          <p>
            We currently ship within the UK only. International delivery is coming
            soon.
          </p>

          <h2>Returns</h2>
          <p>
            Return any unworn item with its tags attached within{" "}
            <strong>30 days</strong> of delivery for a full refund. Start a return
            from your <Link href="/account/orders">order history</Link> or email
            us.
          </p>
          <ul>
            <li>Refunds are processed within 5 working days of us receiving the parcel.</li>
            <li>Return postage is the customer&rsquo;s responsibility unless the item is faulty.</li>
            <li>Sale items can be returned for store credit.</li>
          </ul>

          <h2>Faulty items</h2>
          <p>
            If something arrives damaged or develops a fault, contact{" "}
            <Link href="/contact">our team</Link> with your order number and a
            photo and we&rsquo;ll put it right.
          </p>
        </Prose>
      </div>
    </>
  );
}
