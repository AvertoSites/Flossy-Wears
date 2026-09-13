import type { Metadata } from "next";
import { PageHeader } from "@/components/common/page-header";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { faqGroups } from "@/lib/data/faq";

export const metadata: Metadata = {
  title: "FAQ",
  description: "Answers on delivery, returns, sizing and caring for your Flossy Wears.",
};

export default function FaqPage() {
  return (
    <>
      <PageHeader
        title="Frequently asked questions"
        crumbs={[{ label: "Home", href: "/" }, { label: "FAQ" }]}
      />
      <div className="container-page flex max-w-2xl flex-col gap-10 py-14">
        {faqGroups.map((group) => (
          <section key={group.heading} className="flex flex-col gap-3">
            <h2 className="text-lg font-medium">{group.heading}</h2>
            <Accordion type="single" collapsible className="border-t border-border">
              {group.items.map((item) => (
                <AccordionItem key={item.q} value={item.q}>
                  <AccordionTrigger>{item.q}</AccordionTrigger>
                  <AccordionContent className="text-sm text-muted-foreground">
                    {item.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </section>
        ))}
      </div>
    </>
  );
}
