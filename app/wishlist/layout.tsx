import type { Metadata } from "next";
import type { ReactNode } from "react";
import { publicMetadata } from "@/lib/seo/pages";

export const metadata: Metadata = publicMetadata("wishlist");

export default function WishlistSeoLayout({
  children,
}: {
  children: ReactNode;
}) {
  return children;
}
