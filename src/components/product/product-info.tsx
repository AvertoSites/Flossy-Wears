import Link from "next/link";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { RETURN_WINDOW_DAYS } from "@/lib/constants";
import type { Product } from "@/types";

export function ProductInfo({ product }: { product: Product }) {
  return (
    <Accordion type="multiple" defaultValue={["description"]} className="border-t border-border">
      <AccordionItem value="description">
        <AccordionTrigger>Description</AccordionTrigger>
        <AccordionContent className="text-sm text-muted-foreground">
          {product.description}
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="fabric">
        <AccordionTrigger>Fabric &amp; fit</AccordionTrigger>
        <AccordionContent className="flex flex-col gap-2 text-sm text-muted-foreground">
          <p>{product.fabric}</p>
          <p>{product.fit}</p>
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="care">
        <AccordionTrigger>Care</AccordionTrigger>
        <AccordionContent>
          <ul className="flex list-disc flex-col gap-1 pl-4 text-sm text-muted-foreground">
            {product.care.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="delivery">
        <AccordionTrigger>Delivery &amp; returns</AccordionTrigger>
        <AccordionContent className="flex flex-col gap-2 text-sm text-muted-foreground">
          <p>
            UK delivery via Royal Mail: standard £3.00, free on orders over £100
            (Tracked 48, 2–5 working days) or express £9.00 (Tracked 24, 1–3 working days). Or collect
            for free from our store at 13 Skipsea Road, Sheffield S2 1BT.
          </p>
          <p>
            {RETURN_WINDOW_DAYS}-day returns on unworn items with tags attached.
            See our{" "}
            <Link
              href="/shipping-returns"
              className="text-navy underline underline-offset-2"
            >
              shipping &amp; returns
            </Link>{" "}
            page.
          </p>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
