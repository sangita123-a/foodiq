import type { Metadata } from "next";
import type { ReactNode } from "react";
import JsonLd from "@/components/seo/JsonLd";
import { faqJsonLd, publicPageBreadcrumbJsonLd } from "@/lib/seo/jsonld";
import { HELP_SUPPORT_FAQS } from "@/lib/seo/faq";
import { publicMetadata } from "@/lib/seo/pages";

export const metadata: Metadata = publicMetadata("helpSupport");

export default function HelpSupportSeoLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <>
      <JsonLd
        data={[
          publicPageBreadcrumbJsonLd("Help & Support", "/help-support"),
          faqJsonLd(HELP_SUPPORT_FAQS),
        ]}
      />
      {children}
    </>
  );
}
