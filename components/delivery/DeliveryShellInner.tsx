"use client";

import type { ReactNode } from "react";
import DeliverySidebar from "@/components/delivery/DeliverySidebar";
import DeliveryHeader from "@/components/delivery/DeliveryHeader";
import DeliveryRealtimeBridge from "@/components/delivery/DeliveryRealtimeBridge";

type Props = {
  children: ReactNode;
  title?: string;
  online?: boolean;
};

export default function DeliveryShellInner({ children, title, online }: Props) {
  return (
    <div className="min-h-screen bg-section flex selection:bg-primary selection:text-white">
      <DeliveryRealtimeBridge />
      <div className="hidden lg:block w-64 flex-shrink-0">
        <DeliverySidebar />
      </div>
      <div className="flex-1 flex flex-col min-w-0">
        <DeliveryHeader title={title} online={online} />
        <main className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">
          <div className="max-w-7xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
}
