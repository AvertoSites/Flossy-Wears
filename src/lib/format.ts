import { site } from "@/lib/data/site";

const priceFormatter = new Intl.NumberFormat(site.locale, {
  style: "currency",
  currency: site.currency,
});

const priceFormatterNoDecimals = new Intl.NumberFormat(site.locale, {
  style: "currency",
  currency: site.currency,
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

/** Format an integer number of pence as GBP, e.g. 7500 -> "£75.00". */
export function formatPrice(pence: number, opts?: { compact?: boolean }): string {
  const pounds = pence / 100;
  if (opts?.compact && Number.isInteger(pounds)) {
    return priceFormatterNoDecimals.format(pounds);
  }
  return priceFormatter.format(pounds);
}

const dateFormatter = new Intl.DateTimeFormat(site.locale, {
  day: "numeric",
  month: "long",
  year: "numeric",
});

export function formatDate(iso: string): string {
  return dateFormatter.format(new Date(iso));
}

export function pluralise(count: number, singular: string, plural?: string) {
  return count === 1 ? singular : (plural ?? `${singular}s`);
}
