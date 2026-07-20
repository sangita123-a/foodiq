import type { Metadata } from "next";
import type { ReactNode } from "react";
import JsonLd from "@/components/seo/JsonLd";
import { CONTACT_FAQS } from "@/lib/seo/faq";
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
      {children}
    </>
  );
}
