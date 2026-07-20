"use client";

import { useEffect, useState } from "react";
import { Menu, Shield } from "lucide-react";
import NotificationBell from "@/components/notifications/NotificationBell";
import MobileDrawer from "@/components/ui/MobileDrawer";
import AdminSidebar from "@/components/admin/AdminSidebar";

type AdminHeaderProps = {
  title?: string;
};

export default function AdminHeader({ title = "Admin Console" }: AdminHeaderProps) {
  const [adminName, setAdminName] = useState("Admin");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      setAdminName(user.full_name || user.email || "Admin");
    } catch {
      /* ignore */
    }
  }, []);

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
            <h2 className="text-[#111827] font-black leading-none text-sm sm:text-base truncate">{title}</h2>
            <p className="text-[#9CA3AF] text-[10px] sm:text-xs mt-0.5 sm:mt-1 flex items-center gap-1">
              <Shield className="w-3 h-3 shrink-0" /> Platform administration
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-4 shrink-0">
          <NotificationBell endpoint="/api/notifications" inboxHref="/admin/notifications" />
          <div className="flex items-center gap-2 bg-[#F8FAFC] border border-[#E5E7EB] rounded-full pl-2 pr-3 sm:pr-4 py-1.5">
            <div className="w-8 h-8 rounded-full bg-[#E23744]/15 flex items-center justify-center text-[#E23744] font-black text-sm shrink-0">
              {adminName.charAt(0).toUpperCase()}
            </div>
            <span className="text-sm font-bold text-[#111827] hidden sm:block max-w-[100px] truncate">{adminName}</span>
          </div>
        </div>
      </div>

      <MobileDrawer open={sidebarOpen} onClose={() => setSidebarOpen(false)} side="left" width="w-[min(280px,88vw)]">
        <AdminSidebar variant="drawer" onNavigate={() => setSidebarOpen(false)} />
      </MobileDrawer>
    </>
  );
}
