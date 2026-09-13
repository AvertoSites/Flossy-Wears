import { QuoteIcon } from "lucide-react";
import { RatingStars } from "@/components/common/rating-stars";
import { SectionHeading } from "@/components/common/section-heading";

const QUOTES = [
  {
    body: "The weight of these sweatshirts is unreal. I've worn mine weekly for months and the print hasn't cracked once.",
    author: "Grace A.",
    location: "Manchester",
  },
  {
    body: "Finally, faithwear I'd wear even without the verse. The olive is a perfect colour and the fit is spot on.",
    author: "Daniel O.",
    location: "London",
  },
  {
    body: "Bought one, then two more the same week. Packaging felt premium and delivery was quick.",
    author: "Esther B.",
    location: "Birmingham",
  },
];

export function Testimonials() {
  return (
    <section className="container-page py-16">
      <SectionHeading
        eyebrow="Five stars"
        title="Worn and reviewed"
        align="center"
        className="mb-10"
      />
      <div className="grid gap-6 md:grid-cols-3">
        {QUOTES.map((quote) => (
          <figure
            key={quote.author}
            className="flex flex-col gap-4 rounded-xl border border-border bg-card p-6"
          >
            <QuoteIcon className="size-6 text-gold" />
            <blockquote className="text-sm leading-relaxed text-foreground/90">
              {quote.body}
            </blockquote>
            <figcaption className="mt-auto flex items-center justify-between pt-2">
              <span className="text-sm">
                <span className="font-medium">{quote.author}</span>
                <span className="block text-xs text-muted-foreground">
                  {quote.location}
                </span>
              </span>
              <RatingStars value={5} size={14} />
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}
