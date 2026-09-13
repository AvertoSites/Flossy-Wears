"use client";

import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

/**
 * False on the server and the first client render, true afterwards.
 * Use to gate reads of persisted (localStorage-backed) stores so markup
 * matches during hydration.
 */
export function useMounted() {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
}
