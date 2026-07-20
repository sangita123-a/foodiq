import type { Metadata } from "next";
import type { ReactNode } from "react";
import { buildPrivatePageMetadata } from "@/lib/seo/entity-metadata";

export const metadata: Metadata = buildPrivatePageMetadata({
  title: "Delivery Partner",
  path: "/delivery",
  description: "Foodiq delivery partner portal. Not indexed by search engines.",
});

export default function DeliveryLayout({ children }: { children: ReactNode }) {
  return <div data-delivery-surface className="contents">{children}</div>;
}
