import type { Metadata } from "next";
import type { ReactNode } from "react";
import JsonLd from "@/components/seo/JsonLd";
import { breadcrumbJsonLd } from "@/lib/seo/jsonld";
import { publicMetadata } from "@/lib/seo/pages";

export const metadata: Metadata = publicMetadata("about");

export default function AboutSeoLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "About", path: "/about" },
        ])}
      />
      {children}
    </>
  );
}
