import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="container-page flex flex-col items-center gap-4 py-24 text-center">
      <span className="font-display text-6xl text-gold-dark">404</span>
      <h1 className="text-2xl">Page not found</h1>
      <p className="max-w-sm text-sm text-muted-foreground">
        The page you&rsquo;re looking for has moved or never existed.
      </p>
      <div className="flex gap-3">
        <Button asChild>
          <Link href="/">Back home</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/shop">Shop the line</Link>
        </Button>
      </div>
    </div>
  );
}
