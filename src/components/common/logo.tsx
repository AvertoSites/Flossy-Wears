import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

type LogoProps = {
  className?: string;
  /** Stacked "FLOSSY / WEARS" lockup instead of a single line. */
  stacked?: boolean;
  href?: string | null;
};

export function Logo({ className, stacked = false, href = "/" }: LogoProps) {
  const mark = (
    <span
      className={cn(
        "inline-flex items-center gap-2.5 font-display font-semibold uppercase text-navy",
        className,
      )}
    >
      <span
        aria-hidden
        className="relative size-7 shrink-0 overflow-hidden rounded-full"
      >
        <Image
          src="/logo.jpeg"
          alt=""
          fill
          sizes="28px"
          className="object-cover object-top"
        />
      </span>
      <span
        className={cn(
          "tracking-[0.14em]",
          stacked ? "flex flex-col text-base leading-[0.95]" : "text-lg",
        )}
      >
        Flossy <span className="text-gold-dark">Wears</span>
      </span>
    </span>
  );

  if (href === null) return mark;

  return (
    <Link href={href} aria-label="Flossy Wears — home" className="inline-flex">
      {mark}
    </Link>
  );
}
