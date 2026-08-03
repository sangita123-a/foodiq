import type { Metadata } from "next";
import type { ReactNode } from "react";
import { buildPrivatePageMetadata } from "@/lib/seo/entity-metadata";
import "./admin-theme.css";

export const metadata: Metadata = buildPrivatePageMetadata({
  title: "Admin",
  path: "/admin",
});

export default function PrivateSeoLayout({ children }: { children: ReactNode }) {
  return children;
}

