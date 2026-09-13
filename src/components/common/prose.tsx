import { cn } from "@/lib/utils";

/** Simple readable text column for content pages. */
export function Prose({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex max-w-2xl flex-col gap-4 text-sm leading-relaxed text-muted-foreground",
        "[&_h2]:mt-6 [&_h2]:text-lg [&_h2]:text-foreground [&_h2]:font-medium",
        "[&_a]:text-navy [&_a]:underline [&_a]:underline-offset-2",
        "[&_ul]:flex [&_ul]:list-disc [&_ul]:flex-col [&_ul]:gap-1.5 [&_ul]:pl-5",
        "[&_strong]:text-foreground",
        className,
      )}
    >
      {children}
    </div>
  );
}
