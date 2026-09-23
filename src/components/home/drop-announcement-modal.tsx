"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { XIcon } from "lucide-react";
import { Dialog, DialogClose, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const SEEN_KEY = "fw_drop_modal_seen";

/**
 * Once-per-browser-session promo popup for The Four drop. Delayed slightly
 * so it doesn't fight the hero for attention on first paint.
 */
export function DropAnnouncementModal() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let seen = true;
    try {
      seen = sessionStorage.getItem(SEEN_KEY) === "1";
    } catch {
      // Private browsing / blocked storage — fall back to showing once per page load.
      seen = false;
    }
    if (seen) return;

    const timer = setTimeout(() => setOpen(true), 900);
    return () => clearTimeout(timer);
  }, []);

  function close() {
    setOpen(false);
    try {
      sessionStorage.setItem(SEEN_KEY, "1");
    } catch {
      // Ignore — worst case it shows again next navigation.
    }
  }

  return (
    <Dialog open={open} onOpenChange={(next) => !next && close()}>
      <DialogContent
        showCloseButton={false}
        className="w-full max-w-sm gap-0 overflow-hidden rounded-2xl border-border bg-paper p-0 sm:max-w-md"
      >
        <DialogTitle className="sr-only">The October 2026 drop — The Four is here</DialogTitle>

        <div className="relative aspect-[3/2] w-full">
          <Image
            src="/image/four-women.jpeg"
            alt=""
            fill
            sizes="(min-width: 640px) 28rem, 100vw"
            className="object-cover object-top"
          />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/40 to-transparent" />
          <DialogClose
            aria-label="Close"
            onClick={close}
            className="absolute right-3 top-3 grid size-8 place-items-center rounded-full bg-paper/90 text-ink shadow-sm transition-colors hover:bg-paper"
          >
            <XIcon className="size-4" />
          </DialogClose>
        </div>

        <div className="flex flex-col items-center gap-3 px-6 pb-7 pt-6 text-center">
          <span className="text-xs font-medium uppercase tracking-[0.24em] text-gold-dark">
            The October 2026 drop
          </span>
          <p className="font-display text-2xl leading-tight sm:text-3xl">
            The Four is here.
          </p>
          <p className="max-w-xs text-sm text-muted-foreground">
            Four verses, four colourways, one statement — our signature heavyweight
            crewnecks. Live now, while sizes last.
          </p>
          <div className="mt-2 flex w-full flex-col gap-2 sm:flex-row sm:justify-center">
            <Button asChild size="lg" className="w-full sm:w-auto" onClick={close}>
              <Link href="/collections/the-four">Shop The Four</Link>
            </Button>
            <Button
              variant="ghost"
              size="lg"
              className="w-full text-muted-foreground sm:w-auto"
              onClick={close}
            >
              Maybe later
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
