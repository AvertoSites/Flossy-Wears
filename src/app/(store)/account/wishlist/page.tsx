import type { Metadata } from "next";
import { PageHeader } from "@/components/common/page-header";
import { WishlistView } from "@/components/account/wishlist-view";

export const metadata: Metadata = {
  title: "Wishlist",
  robots: { index: false },
};

export default function WishlistPage() {
  return (
    <>
      <PageHeader
        title="Wishlist"
        description="Pieces you've saved for later."
        crumbs={[{ label: "Home", href: "/" }, { label: "Wishlist" }]}
      />
      <div className="container-page py-12">
        <WishlistView />
      </div>
    </>
  );
}
