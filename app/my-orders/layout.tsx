import type { Metadata } from "next";
import type { ReactNode } from "react";
import { buildPrivatePageMetadata } from "@/lib/seo/entity-metadata";

export const metadata: Metadata = buildPrivatePageMetadata({
  title: "My Orders",
  path: "/my-orders",
});

export default function PrivateSeoLayout({ children }: { children: ReactNode }) {
  return children;
}

