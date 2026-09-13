import { AnnouncementBar } from "@/components/layout/announcement-bar";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { MobileNav } from "@/components/layout/mobile-nav";
import { RouteTransition } from "@/components/layout/route-transition";
import { CartSheet } from "@/components/cart/cart-sheet";
import { SearchDialog } from "@/components/layout/search-dialog";

export default function StoreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <AnnouncementBar />
      <SiteHeader />
      <main className="flex-1">
        <RouteTransition>{children}</RouteTransition>
      </main>
      <SiteFooter />
      <MobileNav />
      <CartSheet />
      <SearchDialog />
    </>
  );
}
