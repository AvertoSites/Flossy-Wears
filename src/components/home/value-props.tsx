import { LeafIcon, RotateCcwIcon, ShieldCheckIcon, TruckIcon } from "lucide-react";

const ITEMS = [
  {
    icon: TruckIcon,
    title: "Free UK delivery",
    copy: "On every order over £75, tracked as standard.",
  },
  {
    icon: RotateCcwIcon,
    title: "30-day returns",
    copy: "Not quite right? Send it back, no fuss.",
  },
  {
    icon: LeafIcon,
    title: "400gsm heavyweight",
    copy: "Brushed loopback cotton that lasts for years.",
  },
  {
    icon: ShieldCheckIcon,
    title: "Secure checkout",
    copy: "Card payments handled by Stripe.",
  },
];

export function ValueProps() {
  return (
    <section className="border-y border-border bg-card">
      <div className="container-page grid gap-6 py-8 sm:grid-cols-2 lg:grid-cols-4">
        {ITEMS.map((item) => (
          <div key={item.title} className="flex items-start gap-3">
            <item.icon className="mt-0.5 size-5 shrink-0 text-gold-dark" />
            <div>
              <p className="text-sm font-medium">{item.title}</p>
              <p className="text-xs text-muted-foreground">{item.copy}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
