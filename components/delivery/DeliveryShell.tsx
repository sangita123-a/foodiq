"use client";

import type { ReactNode } from "react";
import DeliveryShellInner from "./DeliveryShellInner";

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
