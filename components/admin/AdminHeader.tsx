"use client";

import { useEffect, useState } from "react";
import { Menu, Shield } from "lucide-react";
import NotificationBell from "@/components/notifications/NotificationBell";

type AdminHeaderProps = {
  title?: string;
};

export default function AdminHeader({ title = "Admin Console" }: AdminHeaderProps) {
  const [adminName, setAdminName] = useState("Admin");

  useEffect(() => {
    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      setAdminName(user.full_name || user.email || "Admin");
    } catch {
      /* ignore */
    }
  }, []);

  return (
    <div className="h-20 bg-[#FFFFFF] border-b border-[#E5E7EB] flex items-center justify-between px-4 lg:px-8 sticky top-0 z-30">
      <div className="flex items-center gap-4">
        <button type="button" className="lg:hidden text-[#6B7280] hover:text-[#111827]">
          <Menu className="w-6 h-6" />
        </button>
        <div>
          <h2 className="text-[#111827] font-black leading-none">{title}</h2>
          <p className="text-[#9CA3AF] text-xs mt-1 flex items-center gap-1">
            <Shield className="w-3 h-3" /> Platform administration
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <NotificationBell endpoint="/api/notifications" inboxHref="/admin/notifications" />
        <div className="flex items-center gap-2 bg-[#F8FAFC] border border-[#E5E7EB] rounded-full pl-2 pr-4 py-1.5">
          <div className="w-8 h-8 rounded-full bg-[#E23744]/15 flex items-center justify-center text-[#E23744] font-black text-sm">
            {adminName.charAt(0).toUpperCase()}
          </div>
          <span className="text-sm font-bold text-[#111827] hidden sm:block">{adminName}</span>
        </div>
      </div>
    </div>
  );
}
