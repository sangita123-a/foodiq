"use client";

import dynamic from "next/dynamic";
import type { ReactNode } from "react";

const DeliveryShellInner = dynamic(() => import("./DeliveryShellInner"), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-section animate-pulse" aria-hidden />
  ),
});

type Props = {
  children: ReactNode;
  title?: string;
  online?: boolean;
};

export default function DeliveryShell({ children, title, online }: Props) {
  return (
    <DeliveryShellInner title={title} online={online}>
      {children}
    </DeliveryShellInner>
  );
}
