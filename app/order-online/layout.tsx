import type { Metadata } from "next";
import type { ReactNode } from "react";
import InternalSeoLinks from "@/components/seo/InternalSeoLinks";
import JsonLd from "@/components/seo/JsonLd";
import {
  getContextualInternalLinks,
  getInternalLinksNavLabel,
} from "@/lib/seo/internal-links";
import { publicPageBreadcrumbJsonLd } from "@/lib/seo/jsonld";
import { publicMetadata } from "@/lib/seo/pages";

export const metadata: Metadata = publicMetadata("orderOnline");

export default function OrderOnlineSeoLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <>
      <JsonLd data={publicPageBreadcrumbJsonLd("Order Food Online", "/order-online")} />
      <InternalSeoLinks
        links={getContextualInternalLinks("restaurants")}
        label={getInternalLinksNavLabel("restaurants")}
      />
      {children}
    </>
  );
}
