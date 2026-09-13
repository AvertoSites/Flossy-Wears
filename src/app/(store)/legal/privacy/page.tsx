import type { Metadata } from "next";
import { PageHeader } from "@/components/common/page-header";
import { Prose } from "@/components/common/prose";

export const metadata: Metadata = {
  title: "Privacy policy",
  robots: { index: false },
};

export default function PrivacyPage() {
  return (
    <>
      <PageHeader
        title="Privacy policy"
        description="How Flossy Wears handles your data. Placeholder copy for this preview build."
        crumbs={[{ label: "Home", href: "/" }, { label: "Privacy" }]}
      />
      <div className="container-page py-14">
        <Prose>
          <p>
            This is placeholder content for the preview build. Replace it with a
            reviewed privacy policy before launch.
          </p>
          <h2>What we collect</h2>
          <p>
            Contact and delivery details you provide at checkout, order history,
            and basic analytics about how the site is used.
          </p>
          <h2>How we use it</h2>
          <p>
            To process and deliver your orders, provide support, and — only with
            your consent — send marketing about new drops.
          </p>
          <h2>Your rights</h2>
          <p>
            You can request a copy of your data or ask us to delete it by emailing
            our team. Payments are processed by Stripe; we never store card
            details.
          </p>
        </Prose>
      </div>
    </>
  );
}
