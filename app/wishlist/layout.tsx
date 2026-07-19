import type { Metadata } from "next";
import type { ReactNode } from "react";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildPageMetadata({
  title: "Wishlist",
  description: "Private Foodiq wishlist. Not indexed by search engines.",
  path: "/wishlist",
  noIndex: true,
});

export default function WishlistSeoLayout({
  children,
}: {
  children: ReactNode;
}) {
  return children;
}
