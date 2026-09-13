"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { HeartIcon, LogOutIcon, MapPinIcon, PackageIcon, UserIcon } from "lucide-react";
import { useAuth } from "@/lib/store/auth";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/account", label: "Overview", icon: UserIcon },
  { href: "/account/orders", label: "Orders", icon: PackageIcon },
  { href: "/account/addresses", label: "Addresses", icon: MapPinIcon },
  { href: "/account/wishlist", label: "Wishlist", icon: HeartIcon },
];

export function AccountNav() {
  const pathname = usePathname();
  const router = useRouter();
  const signOut = useAuth((s) => s.signOut);

  return (
    <nav className="flex flex-col gap-1">
      {LINKS.map((link) => {
        const active =
          link.href === "/account"
            ? pathname === "/account"
            : pathname.startsWith(link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors",
              active
                ? "bg-cream font-medium text-navy"
                : "text-muted-foreground hover:bg-cream/60 hover:text-foreground",
            )}
          >
            <link.icon className="size-4" />
            {link.label}
          </Link>
        );
      })}
      <button
        type="button"
        onClick={() => {
          signOut();
          router.push("/");
        }}
        className="mt-1 flex items-center gap-2.5 rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-cream/60 hover:text-foreground"
      >
        <LogOutIcon className="size-4" />
        Sign out
      </button>
    </nav>
  );
}
