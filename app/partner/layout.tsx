import type { Metadata } from "next";
import type { ReactNode } from "react";
import { buildPageMetadata } from "@/lib/seo/metadata";
import "./partner-polish.css";

export const metadata: Metadata = buildPageMetadata({
  title: "Restaurant Partner",
  description: "Foodiq restaurant partner portal. Not indexed by search engines.",
  path: "/partner",
  noIndex: true,
});

export default function PartnerLayout({ children }: { children: ReactNode }) {
  return (
    <div data-partner-surface className="contents">
      {children}
    </div>
  );
}
