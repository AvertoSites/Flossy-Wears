import Link from "next/link";
import { ShoppingBagIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

export function EmptyCart({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 py-16 text-center">
      <span className="grid size-14 place-items-center rounded-full bg-cream text-gold-dark">
        <ShoppingBagIcon className="size-6" />
      </span>
      <div className="flex flex-col gap-1">
        <p className="font-medium">Your bag is empty</p>
        <p className="max-w-xs text-sm text-muted-foreground">
          Nothing in here yet. Browse the line and find a verse to carry.
        </p>
      </div>
      <Button asChild onClick={onNavigate}>
        <Link href="/shop">Shop the line</Link>
      </Button>
    </div>
  );
}
