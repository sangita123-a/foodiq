import { Suspense } from "react";
import OrderOnlineView from "@/components/order-online/OrderOnlineView";

export default function OrderOnlinePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-white pt-[90px] text-[#555555]">
          Loading Order Online…
        </div>
      }
    >
      <OrderOnlineView />
    </Suspense>
  );
}
