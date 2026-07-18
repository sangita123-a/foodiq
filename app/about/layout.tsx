import type { Metadata } from "next";
import type { ReactNode } from "react";
import { publicMetadata } from "@/lib/seo/pages";

export const metadata: Metadata = publicMetadata("about");

export default function SeoLayout({ children }: { children: ReactNode }) {
  return children;
}
