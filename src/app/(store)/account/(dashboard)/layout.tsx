import type { Metadata } from "next";
import { AccountGate } from "@/components/account/account-gate";
import { AccountNav } from "@/components/account/account-nav";

export const metadata: Metadata = {
  title: "Account",
  robots: { index: false },
};

export default function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AccountGate>
      <div className="container-page py-12">
        <h1 className="mb-8 text-3xl">My account</h1>
        <div className="grid gap-10 lg:grid-cols-[220px_1fr]">
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <AccountNav />
          </aside>
          <div>{children}</div>
        </div>
      </div>
    </AccountGate>
  );
}
