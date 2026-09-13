import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

type EmptyStateProps = {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: { label: string; href: string };
};

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-4 rounded-lg border border-dashed border-border bg-card px-6 py-16 text-center">
      {Icon && (
        <span className="grid size-12 place-items-center rounded-full bg-cream text-gold-dark">
          <Icon className="size-6" />
        </span>
      )}
      <div className="flex flex-col gap-1">
        <h2 className="text-lg font-medium">{title}</h2>
        {description && (
          <p className="max-w-sm text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {action && (
        <Button asChild>
          <Link href={action.href}>{action.label}</Link>
        </Button>
      )}
    </div>
  );
}
