import type { Metadata } from "next";
import { MailIcon, MapPinIcon, ClockIcon } from "lucide-react";
import { PageHeader } from "@/components/common/page-header";
import { ContactForm } from "@/components/contact/contact-form";
import { site } from "@/lib/data/site";

export const metadata: Metadata = {
  title: "Contact us",
  description: "Get in touch with the Flossy Wears team.",
};

export default function ContactPage() {
  return (
    <>
      <PageHeader
        title="Contact us"
        description="Questions about an order, sizing or a collaboration? We reply within one working day."
        crumbs={[{ label: "Home", href: "/" }, { label: "Contact" }]}
      />
      <div className="container-page grid gap-12 py-14 lg:grid-cols-[1fr_1.4fr]">
        <div className="flex flex-col gap-5 text-sm">
          <div className="flex items-start gap-3">
            <MailIcon className="mt-0.5 size-4 text-gold-dark" />
            <div>
              <p className="font-medium">Email</p>
              <a
                href={`mailto:${site.email}`}
                className="text-muted-foreground hover:text-foreground"
              >
                {site.email}
              </a>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <MapPinIcon className="mt-0.5 size-4 text-gold-dark" />
            <div>
              <p className="font-medium">Studio</p>
              <p className="text-muted-foreground">{site.address}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <ClockIcon className="mt-0.5 size-4 text-gold-dark" />
            <div>
              <p className="font-medium">Support hours</p>
              <p className="text-muted-foreground">Mon–Fri, 9am–5pm GMT</p>
            </div>
          </div>
        </div>
        <ContactForm />
      </div>
    </>
  );
}
