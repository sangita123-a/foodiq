import type { Metadata } from "next";
import type { ReactNode } from "react";
import { publicMetadata } from "@/lib/seo/pages";

export const metadata: Metadata = publicMetadata("orderOnline");

export default function OrderOnlineSeoLayout({
  children,
}: {
  children: ReactNode;
}) {
  return children;
}
