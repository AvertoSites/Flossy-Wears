"use client";

import Link from "next/link";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Logo } from "@/components/common/logo";
import { primaryNav } from "@/lib/data/navigation";
import { site } from "@/lib/data/site";
import { useUI } from "@/lib/store/ui";

export function MobileNav() {
  const open = useUI((s) => s.mobileNavOpen);
  const setOpen = useUI((s) => s.setMobileNavOpen);
  const close = () => setOpen(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent side="left" className="flex w-full flex-col gap-0 p-0 sm:max-w-sm">
        <SheetHeader className="border-b border-border">
          <SheetTitle asChild>
            <Logo href="/" />
          </SheetTitle>
        </SheetHeader>

        <nav className="flex-1 overflow-y-auto px-2 py-2">
          <Accordion type="multiple">
            {primaryNav.map((item) =>
              item.columns ? (
                <AccordionItem key={item.label} value={item.label}>
                  <AccordionTrigger className="px-3 text-base">
                    {item.label}
                  </AccordionTrigger>
                  <AccordionContent className="px-3">
                    <ul className="flex flex-col gap-1 pb-2">
                      {item.columns
                        .flatMap((col) => col.links)
                        .map((link) => (
                          <li key={link.href + link.label}>
                            <Link
                              href={link.href}
                              onClick={close}
                              className="block rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-cream hover:text-foreground"
                            >
                              {link.label}
                            </Link>
                          </li>
                        ))}
                    </ul>
                  </AccordionContent>
                </AccordionItem>
              ) : (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={close}
                  className="flex items-center px-6 py-4 text-base font-medium border-b border-border/60"
                >
                  {item.label}
                </Link>
              ),
            )}
          </Accordion>
        </nav>

        <div className="border-t border-border px-6 py-4 text-sm">
          <Link href="/account" onClick={close} className="block py-1.5">
            Account
          </Link>
          <Link href="/account/wishlist" onClick={close} className="block py-1.5">
            Wishlist
          </Link>
          <a
            href={site.social.instagram}
            target="_blank"
            rel="noreferrer"
            className="block py-1.5 text-muted-foreground"
          >
            Instagram
          </a>
          <a
            href={site.social.facebook}
            target="_blank"
            rel="noreferrer"
            className="block py-1.5 text-muted-foreground"
          >
            Facebook
          </a>
        </div>
      </SheetContent>
    </Sheet>
  );
}
