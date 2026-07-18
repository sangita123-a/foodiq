import type { Metadata } from "next";
import type { ReactNode } from "react";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildPageMetadata({
  title: "Profile",
  description: "Private Foodiq page. Not indexed by search engines.",
  path: "/",
  noIndex: true,
});

export default function PrivateSeoLayout({ children }: { children: ReactNode }) {
  return children;
}
