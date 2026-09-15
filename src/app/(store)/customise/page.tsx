import type { Metadata } from "next";
import { getCustomizableProducts } from "@/lib/api";
import { PageHeader } from "@/components/common/page-header";
import { CustomiseView } from "@/components/customise/customise-view";

export const metadata: Metadata = {
  title: "Customise your own",
  description:
    "Pick a Flossy Wears design and swap in your own verse and reference — printed the way you wrote it.",
};

export default async function CustomisePage() {
  const products = await getCustomizableProducts();

  return (
    <>
      <PageHeader
        eyebrow="Made yours"
        title="Customise your own"
        description="Choose a design from our collection, then tell us the verse and chapter you want on it instead. We'll print it in the same place, same style — just your words."
        crumbs={[{ label: "Home", href: "/" }, { label: "Customise your own" }]}
      />
      <CustomiseView products={products} />
    </>
  );
}
