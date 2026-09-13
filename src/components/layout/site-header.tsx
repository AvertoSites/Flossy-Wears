"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { HeartIcon, MenuIcon, SearchIcon, ShoppingBagIcon, UserIcon } from "lucide-react";
import { Logo } from "@/components/common/logo";
import { primaryNav, type NavItem } from "@/lib/data/navigation";
import { useCart } from "@/lib/store/cart";
import { useWishlist } from "@/lib/store/wishlist";
import { useUI } from "@/lib/store/ui";
import { useMounted } from "@/lib/hooks/use-mounted";
import { cn } from "@/lib/utils";

function MegaPanel({
  item,
  open,
  onNavigate,
}: {
  item: NavItem;
  open: boolean;
  onNavigate: () => void;
}) {
  if (!item.columns) return null;
  return (
    <div
      className={cn(
        "absolute inset-x-0 top-full z-40 origin-top border-b border-border bg-card shadow-sm",
        "transition duration-200 ease-out motion-reduce:transition-none",
        "group-focus-within:pointer-events-auto group-focus-within:translate-y-0 group-focus-within:scale-y-100 group-focus-within:opacity-100",
        open
          ? "pointer-events-auto translate-y-0 scale-y-100 opacity-100"
          : "pointer-events-none -translate-y-1 scale-y-95 opacity-0",
      )}
    >
      <div className="container-page grid grid-cols-[repeat(auto-fit,minmax(160px,1fr))] gap-8 py-8 lg:grid-cols-4">
        {item.columns.map((col) => (
          <div key={col.heading} className="flex flex-col gap-3">
            <span className="text-xs font-medium uppercase tracking-[0.18em] text-gold-dark">
              {col.heading}
            </span>
            <ul className="flex flex-col gap-2">
              {col.links.map((link) => (
                <li key={link.href + link.label}>
                  <Link
                    href={link.href}
                    onClick={onNavigate}
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
        {item.feature && (
          <Link
            href={item.feature.href}
            onClick={onNavigate}
            className="group/feature relative col-span-1 hidden overflow-hidden rounded-lg bg-cream lg:block"
          >
            <Image
              src={item.feature.image}
              alt=""
              width={320}
              height={220}
              className="h-full w-full object-cover transition-transform duration-500 group-hover/feature:scale-105"
            />
            <span className="absolute inset-0 bg-linear-to-t from-navy/70 to-transparent" />
            <span className="absolute inset-x-4 bottom-4 text-primary-foreground">
              <span className="block font-display text-lg">{item.feature.title}</span>
              <span className="block text-xs text-primary-foreground/80">
                {item.feature.copy}
              </span>
            </span>
          </Link>
        )}
      </div>
    </div>
  );
}

export function SiteHeader() {
  const mounted = useMounted();
  const [scrolled, setScrolled] = useState(false);
  const [openNav, setOpenNav] = useState<string | null>(null);
  const count = useCart((s) => s.totalItems());
  const wishCount = useWishlist((s) => s.slugs.length);
  const setCartOpen = useUI((s) => s.setCartOpen);
  const setMobileNavOpen = useUI((s) => s.setMobileNavOpen);
  const setSearchOpen = useUI((s) => s.setSearchOpen);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      style={{ viewTransitionName: "site-header" }}
      className={cn(
        "sticky top-0 z-40 bg-paper/95 backdrop-blur transition-shadow",
        scrolled && "shadow-[0_1px_0_0_var(--border)]",
      )}
    >
      <div className="container-page flex h-16 items-center justify-between gap-4">
        <div className="flex items-center gap-2 lg:gap-8">
          <button
            type="button"
            className="grid size-9 place-items-center lg:hidden"
            aria-label="Open menu"
            onClick={() => setMobileNavOpen(true)}
          >
            <MenuIcon className="size-5" />
          </button>
          <Logo href="/" />
        </div>

        <nav className="hidden items-center lg:flex">
          {primaryNav.map((item) => (
            <div
              key={item.label}
              className="group static"
              onMouseEnter={() => setOpenNav(item.label)}
              onMouseLeave={() => setOpenNav((current) => (current === item.label ? null : current))}
            >
              <Link
                href={item.href}
                className="inline-flex h-16 items-center px-4 text-sm font-medium text-foreground/80 transition-colors hover:text-foreground"
              >
                {item.label}
              </Link>
              <MegaPanel
                item={item}
                open={openNav === item.label}
                onNavigate={() => setOpenNav(null)}
              />
            </div>
          ))}
        </nav>

        <div className="flex items-center gap-0.5">
          <button
            type="button"
            className="grid size-9 place-items-center text-foreground/80 transition-colors hover:text-foreground"
            aria-label="Search"
            onClick={() => setSearchOpen(true)}
          >
            <SearchIcon className="size-5" />
          </button>
          <Link
            href="/account"
            className="hidden size-9 place-items-center text-foreground/80 transition-colors hover:text-foreground sm:grid"
            aria-label="Account"
          >
            <UserIcon className="size-5" />
          </Link>
          <Link
            href="/account/wishlist"
            className="relative grid size-9 place-items-center text-foreground/80 transition-colors hover:text-foreground"
            aria-label="Wishlist"
          >
            <HeartIcon className="size-5" />
            {mounted && wishCount > 0 && (
              <span className="absolute right-1 top-1 size-1.5 rounded-full bg-gold" />
            )}
          </Link>
          <button
            type="button"
            className="relative grid size-9 place-items-center text-foreground/80 transition-colors hover:text-foreground"
            aria-label="Open bag"
            onClick={() => setCartOpen(true)}
          >
            <ShoppingBagIcon className="size-5" />
            {mounted && count > 0 && (
              <span className="absolute -right-0.5 -top-0.5 grid min-w-[1.125rem] place-items-center rounded-full bg-navy px-1 text-[0.65rem] font-medium text-primary-foreground">
                {count}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
