"use client";

import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { AuthListener } from "@/components/providers/auth-listener";
import { WishlistSync } from "@/components/providers/wishlist-sync";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <AuthListener />
      <WishlistSync />
      <TooltipProvider delayDuration={200}>{children}</TooltipProvider>
      <Toaster richColors closeButton position="top-center" />
    </QueryClientProvider>
  );
}
