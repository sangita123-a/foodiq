import type { Metadata } from "next";
import type { ReactNode } from "react";
import InternalSeoLinks from "@/components/seo/InternalSeoLinks";
import JsonLd from "@/components/seo/JsonLd";
import { CONTACT_FAQS } from "@/lib/seo/faq";
import {
  getContextualInternalLinks,
  getInternalLinksNavLabel,
} from "@/lib/seo/internal-links";
import {
  breadcrumbJsonLd,
  faqJsonLd,
  localBusinessJsonLd,
} from "@/lib/seo/jsonld";
import { publicMetadata } from "@/lib/seo/pages";

export const metadata: Metadata = publicMetadata("contact");

export default function ContactSeoLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <JsonLd
        data={[
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Contact", path: "/contact" },
          ]),
          localBusinessJsonLd(),
          faqJsonLd(CONTACT_FAQS),
        ]}
      />
      <InternalSeoLinks
        links={getContextualInternalLinks("contact")}
        label={getInternalLinksNavLabel("contact")}
      />
      {children}
    </>
  );
}
