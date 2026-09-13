import type { Metadata } from "next";
import { Suspense } from "react";
import { PageHeader } from "@/components/common/page-header";
import { TrackView } from "@/components/track/track-view";

export const metadata: Metadata = {
  title: "Track your order",
  description: "Check the status and delivery tracking for your Flossy Wears order.",
};

export default async function TrackPage({ searchParams }: PageProps<"/track">) {
  const { order } = await searchParams;
  return (
    <>
      <PageHeader
        title="Track your order"
        crumbs={[{ label: "Home", href: "/" }, { label: "Track order" }]}
      />
      <Suspense fallback={<div className="container-page py-16" />}>
        <TrackView initialOrder={typeof order === "string" ? order : ""} />
      </Suspense>
    </>
  );
}
