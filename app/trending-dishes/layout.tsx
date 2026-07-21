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

export const metadata: Metadata = publicMetadata("trendingDishes");

export default function SeoLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <JsonLd data={publicPageBreadcrumbJsonLd("Trending Dishes", "/trending-dishes")} />
      <InternalSeoLinks
        links={getContextualInternalLinks("trendingDishes")}
        label={getInternalLinksNavLabel("trendingDishes")}
      />
      {children}
    </>
  );
}
