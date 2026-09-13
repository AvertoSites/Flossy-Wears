import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/common/page-header";
import { Prose } from "@/components/common/prose";

export const metadata: Metadata = {
  title: "Size guide",
  description: "Measurements and fit notes for Flossy Wears sweatshirts, tees and hoodies.",
};

const ROWS = [
  { size: "XS", chest: "34–36", length: "66", sleeve: "60" },
  { size: "S", chest: "36–38", length: "68", sleeve: "61" },
  { size: "M", chest: "38–40", length: "70", sleeve: "62" },
  { size: "L", chest: "42–44", length: "72", sleeve: "63" },
  { size: "XL", chest: "46–48", length: "74", sleeve: "64" },
  { size: "2XL", chest: "50–52", length: "76", sleeve: "65" },
  { size: "3XL", chest: "54–56", length: "78", sleeve: "66" },
];

export default function SizingPage() {
  return (
    <>
      <PageHeader
        title="Size guide"
        description="All measurements in inches. Garments are a relaxed unisex fit."
        crumbs={[{ label: "Home", href: "/" }, { label: "Size guide" }]}
      />
      <div className="container-page flex flex-col gap-8 py-14">
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead className="bg-cream text-left">
              <tr>
                <th className="px-4 py-3 font-medium">Size</th>
                <th className="px-4 py-3 font-medium">Chest (to fit)</th>
                <th className="px-4 py-3 font-medium">Body length</th>
                <th className="px-4 py-3 font-medium">Sleeve length</th>
              </tr>
            </thead>
            <tbody>
              {ROWS.map((row) => (
                <tr key={row.size} className="border-t border-border">
                  <td className="px-4 py-3 font-medium">{row.size}</td>
                  <td className="px-4 py-3 text-muted-foreground">{row.chest}</td>
                  <td className="px-4 py-3 text-muted-foreground">{row.length}</td>
                  <td className="px-4 py-3 text-muted-foreground">{row.sleeve}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Prose>
          <h2>How it fits</h2>
          <p>
            Our crewnecks and hoodies have dropped shoulders and a boxy body for
            a relaxed, modern fit. If you prefer a classic fit, size down.
          </p>
          <h2>How to measure</h2>
          <ul>
            <li>
              <strong>Chest:</strong> measure around the fullest part, keeping the
              tape level.
            </li>
            <li>
              <strong>Body length:</strong> from the highest point of the shoulder
              straight down to the hem.
            </li>
          </ul>
          <p>
            Still unsure? Email{" "}
            <Link href="/contact">our team</Link> with your usual size and
            we&rsquo;ll help.
          </p>
        </Prose>
      </div>
    </>
  );
}
