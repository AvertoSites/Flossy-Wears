import Link from "next/link";
import { FacebookIcon, InstagramIcon } from "@/components/common/social-icons";
import { Logo } from "@/components/common/logo";
import { NewsletterForm } from "@/components/layout/newsletter-form";
import { footerNav } from "@/lib/data/navigation";
import { site } from "@/lib/data/site";

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-border bg-cream">
      <div className="container-page grid gap-12 py-16 lg:grid-cols-[1.2fr_2fr]">
        <div className="flex flex-col gap-4">
          <Logo href="/" />
          <p className="max-w-xs text-sm text-muted-foreground">
            Premium, editorial faith apparel. Designed in the UK, made to be lived in.
          </p>
          <div className="mt-2">
            <p className="mb-2 text-xs font-medium uppercase tracking-[0.18em] text-gold-dark">
              Join the list
            </p>
            <NewsletterForm className="max-w-sm" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
          {footerNav.map((col) => (
            <div key={col.heading} className="flex flex-col gap-3">
              <span className="text-xs font-medium uppercase tracking-[0.18em] text-gold-dark">
                {col.heading}
              </span>
              <ul className="flex flex-col gap-2">
                {col.links.map((link) => (
                  <li key={link.href + link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t border-border/70">
        <div className="container-page flex flex-col items-center justify-between gap-3 py-5 text-xs text-muted-foreground sm:flex-row">
          <p>
            © {new Date().getFullYear()} {site.name}. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <a
              href={site.social.instagram}
              aria-label="Instagram"
              target="_blank"
              rel="noreferrer"
              className="transition-colors hover:text-foreground"
            >
              <InstagramIcon className="size-4" />
            </a>
            <a
              href={site.social.facebook}
              aria-label="Facebook"
              target="_blank"
              rel="noreferrer"
              className="transition-colors hover:text-foreground"
            >
              <FacebookIcon className="size-4" />
            </a>
            <span>Prices in GBP</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
