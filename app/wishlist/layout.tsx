import type { Metadata } from "next";
import type { ReactNode } from "react";
import { buildPrivatePageMetadata } from "@/lib/seo/entity-metadata";

export const metadata: Metadata = buildPrivatePageMetadata({
  title: "Wishlist",
  path: "/wishlist",
});

export default function WishlistSeoLayout({
  children,
}: {
  children: ReactNode;
}) {
  return children;
}
