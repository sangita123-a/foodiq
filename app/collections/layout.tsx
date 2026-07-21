import type { Metadata } from "next";
import type { ReactNode } from "react";
import JsonLd from "@/components/seo/JsonLd";
import { publicPageBreadcrumbJsonLd } from "@/lib/seo/jsonld";
import { publicMetadata } from "@/lib/seo/pages";

export const metadata: Metadata = publicMetadata("collections");

export default function SeoLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <JsonLd data={publicPageBreadcrumbJsonLd("Collections", "/collections")} />
      {children}
    </>
  );
}
