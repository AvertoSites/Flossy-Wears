import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/common/page-header";
import { Prose } from "@/components/common/prose";

export const metadata: Metadata = {
  title: "Terms of service",
  robots: { index: false },
};

export default function TermsPage() {
  return (
    <>
      <PageHeader
        title="Terms of service"
        description="Placeholder terms for this preview build."
        crumbs={[{ label: "Home", href: "/" }, { label: "Terms" }]}
      />
      <div className="container-page py-14">
        <Prose>
          <p>
            This is placeholder content for the preview build. Replace it with
            reviewed terms of service before launch.
          </p>
          <h2>Orders</h2>
          <p>
            All orders are subject to acceptance and availability. Prices are in
            GBP and include VAT where applicable.
          </p>
          <h2>Returns</h2>
          <p>
            Our returns policy is set out on the{" "}
            <Link href="/shipping-returns">shipping &amp; returns</Link> page and
            forms part of these terms.
          </p>
          <h2>Liability</h2>
          <p>
            Nothing in these terms limits your statutory rights as a consumer in
            the United Kingdom.
          </p>
        </Prose>
      </div>
    </>
  );
}
