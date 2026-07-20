import type { Metadata } from "next";
import type { ReactNode } from "react";
import { buildPrivatePageMetadata } from "@/lib/seo/entity-metadata";
import "./partner-polish.css";

export const metadata: Metadata = buildPrivatePageMetadata({
  title: "Restaurant Partner",
  path: "/partner",
  description: "Foodiq restaurant partner portal. Not indexed by search engines.",
});

export default function PartnerLayout({ children }: { children: ReactNode }) {
  return (
    <div data-partner-surface className="contents">
      {children}
    </div>
  );
}
