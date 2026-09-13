"use client";

import { useEffect, useState } from "react";
import { XIcon } from "lucide-react";

const MESSAGES = [
  "Free UK delivery on orders over £75",
  "The Four — the October 2026 drop is live",
  "30-day returns · Faith you can wear",
];

export function AnnouncementBar() {
  const [index, setIndex] = useState(0);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    try {
      if (sessionStorage.getItem("fw-announce-dismissed") === "1") {
        // Restore the dismissed state chosen earlier this session.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setDismissed(true);
      }
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    if (dismissed) return;
    const id = setInterval(
      () => setIndex((i) => (i + 1) % MESSAGES.length),
      5000,
    );
    return () => clearInterval(id);
  }, [dismissed]);

  if (dismissed) return null;

  return (
    <div className="relative bg-navy text-primary-foreground">
      <div className="container-page flex h-9 items-center justify-center">
        <p
          key={index}
          className="animate-in fade-in slide-in-from-bottom-1 text-center text-xs tracking-wide duration-500"
        >
          {MESSAGES[index]}
        </p>
      </div>
      <button
        type="button"
        onClick={() => {
          setDismissed(true);
          try {
            sessionStorage.setItem("fw-announce-dismissed", "1");
          } catch {
            /* ignore */
          }
        }}
        aria-label="Dismiss announcement"
        className="absolute right-3 top-1/2 -translate-y-1/2 text-primary-foreground/70 transition-colors hover:text-primary-foreground"
      >
        <XIcon className="size-3.5" />
      </button>
    </div>
  );
}
