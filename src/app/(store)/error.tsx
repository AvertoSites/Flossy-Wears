"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="container-page flex flex-col items-center gap-4 py-24 text-center">
      <h1 className="text-2xl">Something went wrong</h1>
      <p className="max-w-sm text-sm text-muted-foreground">
        We hit an unexpected error loading this page. Try again in a moment.
      </p>
      <Button onClick={reset}>Try again</Button>
    </div>
  );
}
