"use client";

import { ViewTransition } from "react";
import { usePathname } from "next/navigation";

/**
 * Crossfades + lifts page content on every route change using React's
 * `<ViewTransition>` (backed by the browser View Transitions API). The
 * `key={pathname}` makes each route a distinct instance, so React treats
 * navigation as an exit/enter pair instead of an in-place update.
 *
 * Persistent chrome (header, footer, nav) lives outside this boundary in
 * the layout, so it never participates in the transition — see the
 * `site-header` view-transition-name anchor in globals.css.
 */
export function RouteTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <ViewTransition key={pathname} enter="route-enter" exit="route-exit" default="none">
      {children}
    </ViewTransition>
  );
}
