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
            Free UK delivery on orders over £75. Standard delivery £3.95 (Royal
            Mail Tracked 48), express £5.95 (Tracked 24).
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
