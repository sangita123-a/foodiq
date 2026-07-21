import type { Metadata } from "next";
import type { ReactNode } from "react";
import { publicMetadata } from "@/lib/seo/pages";

export const metadata: Metadata = publicMetadata("orders");

export default function PrivateSeoLayout({ children }: { children: ReactNode }) {
  return children;
}

