import type { Metadata } from "next";
import type { ReactNode } from "react";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildPageMetadata({
  title: "Delivery Partner",
  description: "Foodiq delivery partner portal. Not indexed by search engines.",
  path: "/delivery",
  noIndex: true,
});

export default function DeliveryLayout({ children }: { children: ReactNode }) {
  return <div data-delivery-surface className="contents">{children}</div>;
}
