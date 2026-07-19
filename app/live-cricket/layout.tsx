import type { Metadata } from "next";
import type { ReactNode } from "react";
import { publicMetadata } from "@/lib/seo/pages";

export const metadata: Metadata = publicMetadata("liveCricket");

export default function LiveCricketSeoLayout({
  children,
}: {
  children: ReactNode;
}) {
  return children;
}
