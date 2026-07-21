"use client";

import dynamic from "next/dynamic";

const FloatingCart = dynamic(() => import("@/components/FloatingCart"), {
  ssr: false,
});

export default function ClientFloatingCart() {
  return <FloatingCart />;
}
