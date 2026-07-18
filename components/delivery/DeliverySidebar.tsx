"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  Map,
  DollarSign,
  Bell,
  LogOut,
  FileBadge,
  Star,
} from "lucide-react";
import { clearClientAuth } from "@/lib/authSession";

export default function DeliverySidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const menuItems = [
    { name: "Dashboard", icon: LayoutDashboard, href: "/delivery/dashboard" },
    { name: "Orders", icon: Package, href: "/delivery/orders" },
    { name: "Map", icon: Map, href: "/delivery/map" },
    { name: "Earnings", icon: DollarSign, href: "/delivery/earnings" },
    { name: "Ratings", icon: Star, href: "/delivery/reviews" },
    { name: "Documents", icon: FileBadge, href: "/delivery/documents" },
    { name: "Notifications", icon: Bell, href: "/delivery/notifications" },
  ];

  const handleLogout = () => {
    clearClientAuth();
    router.push("/delivery/login");
  };

  return (
    <div className="w-64 bg-[#FFFFFF] h-screen border-r border-[#E5E7EB] flex flex-col fixed left-0 top-0 z-40">
      <div className="h-20 flex items-center px-6 border-b border-[#E5E7EB]">
        <Link href="/delivery/dashboard" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-[#FC8019] rounded-lg flex items-center justify-center font-black text-white text-xl">
            F
          </div>
          <span className="text-xl font-black text-[#111827] tracking-tight">
            Foodiq{" "}
            <span className="text-[#FC8019] text-sm uppercase tracking-widest font-bold ml-1 border border-[#FC8019]/30 px-1.5 py-0.5 rounded">
              Rider
            </span>
          </span>
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto py-6 px-4 space-y-1 custom-scrollbar">
        {menuItems.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                isActive
                  ? "bg-[#FC8019] text-white shadow-[0_0_15px_rgba(252,128,25,0.3)]"
                  : "text-[#6B7280] hover:text-[#111827] hover:bg-[#F8FAFC]"
              }`}
            >
              <item.icon
                className={`w-5 h-5 ${
                  isActive
                    ? "text-white"
                    : "text-[#9CA3AF] group-hover:text-[#111827]"
                }`}
              />
              <span className="font-bold text-sm">{item.name}</span>
            </Link>
          );
        })}

        <div className="pt-6 mt-6 border-t border-[#E5E7EB]">
          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-red-500 hover:bg-red-500/10 group text-left"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-bold text-sm">Logout</span>
          </button>
        </div>
      </div>
    </div>
  );
}
