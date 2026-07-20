"use client";

import { useState } from "react";
import { Menu } from "lucide-react";
import { mutate } from "swr";
import { useDeliveryMe } from "@/hooks/useDeliveryData";
import { setDeliveryAvailability } from "@/services/deliveryApi";
import NotificationBell from "@/components/notifications/NotificationBell";
import MobileDrawer from "@/components/ui/MobileDrawer";
import DeliverySidebar from "@/components/delivery/DeliverySidebar";

type DeliveryHeaderProps = {
  title?: string;
  online?: boolean;
};

export default function DeliveryHeader({ title, online }: DeliveryHeaderProps) {
  const { data: me } = useDeliveryMe();
  const [toggling, setToggling] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const partner = me?.partner as { is_available?: boolean; full_name?: string } | undefined;
  const isOnline = online ?? Boolean(partner?.is_available);
  const name = me?.user?.full_name || partner?.full_name || "Delivery Partner";

  const toggleOnline = async () => {
    setToggling(true);
    try {
      await setDeliveryAvailability(!isOnline);
      mutate("/api/delivery/dashboard");
      mutate("/api/delivery/me");
    } finally {
      setToggling(false);
    }
  };

  return (
    <>
      <div className="h-16 sm:h-20 bg-[#FFFFFF] border-b border-[#E5E7EB] flex items-center justify-between px-3 sm:px-4 lg:px-8 sticky top-0 z-30 safe-top">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden touch-target flex items-center justify-center text-[#6B7280] hover:text-[#111827] p-2 -ml-1"
            aria-label="Open navigation menu"
          >
            <Menu className="w-6 h-6" />
          </button>
          <div className="min-w-0">
            <p className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-[#9CA3AF]">
              Delivery Partner
            </p>
            <h1 className="text-sm sm:text-lg font-black text-[#111827] truncate">
              {title || `Hi, ${name.split(" ")[0]}`}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-4 shrink-0">
          <button
            type="button"
            onClick={toggleOnline}
            disabled={toggling}
            className={`touch-target flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl font-bold text-xs sm:text-sm transition-colors ${
              isOnline
                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                : "bg-[#F8FAFC] text-[#6B7280] border border-[#E5E7EB]"
            }`}
          >
            <span
              className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                isOnline ? "bg-emerald-500" : "bg-[#9CA3AF]"
              }`}
            />
            {isOnline ? "Online" : "Offline"}
          </button>

          <NotificationBell
            endpoint="/api/delivery/notifications"
            inboxHref="/delivery/notifications"
          />
        </div>
      </div>

      <MobileDrawer open={sidebarOpen} onClose={() => setSidebarOpen(false)} side="left" width="w-[min(280px,88vw)]">
        <DeliverySidebar variant="drawer" onNavigate={() => setSidebarOpen(false)} />
      </MobileDrawer>
    </>
  );
}
