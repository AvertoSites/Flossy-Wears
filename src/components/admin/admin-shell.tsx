"use client";

import Link from "next/link";
import { ViewTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  BarChart3Icon,
  CreditCardIcon,
  LayoutDashboardIcon,
  LogOutIcon,
  PackageIcon,
  PercentIcon,
  SettingsIcon,
  ShoppingCartIcon,
  StarIcon,
  UsersIcon,
  WarehouseIcon,
} from "lucide-react";
import { useAuth } from "@/lib/store/auth";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboardIcon, exact: true },
  { href: "/admin/orders", label: "Orders", icon: ShoppingCartIcon },
  { href: "/admin/products", label: "Products", icon: PackageIcon },
  { href: "/admin/inventory", label: "Inventory", icon: WarehouseIcon },
  { href: "/admin/customers", label: "Customers", icon: UsersIcon },
  { href: "/admin/discounts", label: "Discounts", icon: PercentIcon },
  { href: "/admin/payments", label: "Payments", icon: CreditCardIcon },
  { href: "/admin/reviews", label: "Reviews", icon: StarIcon },
  { href: "/admin/settings", label: "Settings", icon: SettingsIcon },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const signOut = useAuth((s) => s.signOut);

  return (
    <div className="flex min-h-screen bg-[#f4f1ea] text-[#1f1b16]">
      <aside
        style={{ viewTransitionName: "admin-sidebar" }}
        className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-black/10 bg-[#1e3a5f] text-white lg:flex"
      >
        <div className="flex h-16 items-center gap-2 border-b border-white/10 px-5 font-display text-lg">
          <BarChart3Icon className="size-4 text-[#e4c87b]" />
          Flossy Admin
        </div>
        <nav className="flex flex-1 flex-col gap-0.5 p-3">
          {NAV.map((item) => {
            const active = item.exact
              ? pathname === item.href
              : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors",
                  active
                    ? "bg-white/15 font-medium text-white"
                    : "text-white/70 hover:bg-white/10 hover:text-white",
                )}
              >
                <item.icon className="size-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-white/10 p-3">
          <button
            type="button"
            onClick={() => {
              signOut();
              router.replace("/admin/login");
            }}
            className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm text-white/70 transition-colors hover:bg-white/10 hover:text-white"
          >
            <LogOutIcon className="size-4" />
            Sign out
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header
          style={{ viewTransitionName: "admin-header" }}
          className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-black/10 bg-white/80 px-5 backdrop-blur"
        >
          <MobileNav pathname={pathname} />
          <span className="font-display text-sm lg:hidden">Flossy Admin</span>
          <Link
            href="/"
            target="_blank"
            className="ml-auto text-sm text-[#1e3a5f] underline-offset-4 hover:underline"
          >
            View store ↗
          </Link>
        </header>
        <main className="flex-1 p-5 lg:p-8">
          <ViewTransition key={pathname} enter="route-enter" exit="route-exit" default="none">
            {children}
          </ViewTransition>
        </main>
      </div>
    </div>
  );
}

function MobileNav({ pathname }: { pathname: string }) {
  return (
    <select
      value={NAV.find((n) => (n.exact ? pathname === n.href : pathname.startsWith(n.href)))?.href ?? "/admin"}
      onChange={(e) => {
        window.location.assign(e.target.value);
      }}
      className="rounded-md border border-black/15 bg-white px-3 py-1.5 text-sm lg:hidden"
      aria-label="Admin section"
    >
      {NAV.map((item) => (
        <option key={item.href} value={item.href}>
          {item.label}
        </option>
      ))}
    </select>
  );
}
