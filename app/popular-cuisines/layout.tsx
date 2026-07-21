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

export const metadata: Metadata = publicMetadata("popularCuisines");

export default function SeoLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <JsonLd data={publicPageBreadcrumbJsonLd("Popular Cuisines", "/popular-cuisines")} />
      <InternalSeoLinks
        links={getContextualInternalLinks("categories")}
        label={getInternalLinksNavLabel("categories")}
      />
      {children}
    </>
  );
}
