import type { Metadata } from "next";
import type { ReactNode } from "react";
import { buildPrivatePageMetadata } from "@/lib/seo/entity-metadata";

export const metadata: Metadata = buildPrivatePageMetadata({
  title: "Help Center",
  path: "/help-center",
});

export default function HelpCenterLayout({ children }: { children: ReactNode }) {
  return children;
}
