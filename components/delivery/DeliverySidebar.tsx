"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  CheckSquare,
  History,
  Wallet,
  DollarSign,
  User,
  FileText,
  HelpCircle,
  LogOut,
  Bell,
  Map,
  Navigation,
  Receipt,
  Landmark,
  Calendar,
  Settings,
  BarChart3,
  WifiOff,
  AlertTriangle,
  Share2,
} from "lucide-react";
import { clearClientAuth } from "@/lib/authSession";

export default function DeliverySidebar({
  variant = "fixed",
  onNavigate,
}: {
  variant?: "fixed" | "drawer";
  onNavigate?: () => void;
} = {}) {
  const pathname = usePathname();
  const router = useRouter();

  const menuItems = [
    { name: "Dashboard", icon: LayoutDashboard, href: "/delivery/dashboard" },
    { name: "Shift Schedule", icon: Calendar, href: "/delivery/shifts" },
    { name: "Delivery Zones", icon: Map, href: "/delivery/zones" },
    { name: "Available Orders", icon: Package, href: "/delivery/orders?tab=available" },
    { name: "Assigned Orders", icon: CheckSquare, href: "/delivery/orders/assigned" },
    { name: "Navigation", icon: Navigation, href: "/delivery/navigation" },
    { name: "Order History", icon: History, href: "/delivery/history" },
    { name: "Wallet", icon: Wallet, href: "/delivery/wallet" },
    { name: "Bank Account", icon: Landmark, href: "/delivery/bank-account" },
    { name: "Transactions", icon: Receipt, href: "/delivery/transactions" },
    { name: "Earnings", icon: DollarSign, href: "/delivery/earnings" },
    { name: "Analytics", icon: BarChart3, href: "/delivery/analytics" },
    { name: "Notifications", icon: Bell, href: "/delivery/notifications" },
    { name: "Offline Sync", icon: WifiOff, href: "/delivery/offline" },
    { name: "Referrals", icon: Share2, href: "/delivery/referrals" },
    { name: "Emergency SOS", icon: AlertTriangle, href: "/delivery/emergency" },
    { name: "Profile", icon: User, href: "/delivery/profile" },
    { name: "Documents", icon: FileText, href: "/delivery/documents" },
    { name: "Settings", icon: Settings, href: "/delivery/settings" },
    { name: "Support", icon: HelpCircle, href: "/delivery/support" },
  ];

  const handleLogout = () => {
    clearClientAuth();
    router.push("/delivery/login");
  };

  return (
    <aside
      className={`w-64 bg-white h-full border-r border-border flex flex-col ${
        variant === "fixed" ? "h-screen fixed left-0 top-0 z-40" : "relative"
      }`}
    >
      {/* Brand Header */}
      <div className="h-16 sm:h-20 flex items-center px-6 border-b border-border shrink-0">
        <Link href="/delivery/dashboard" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-primary text-white flex items-center justify-center font-black text-lg shadow-sm group-hover:scale-105 transition-transform">
            F
          </div>
          <div className="flex flex-col">
            <span className="font-extrabold text-lg leading-none text-foreground tracking-tight">
              Food<span className="text-primary">iq</span>
            </span>
            <span className="text-[10px] font-bold tracking-wider text-primary uppercase mt-0.5">
              Rider Portal
            </span>
          </div>
        </Link>
      </div>

      {/* Navigation Items */}
      <div className="flex-1 overflow-y-auto py-6 px-4 space-y-1 custom-scrollbar">
        {menuItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href.includes("?") && pathname === item.href.split("?")[0]) ||
            (!item.href.includes("?") && pathname.startsWith(`${item.href}/`));

          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={onNavigate}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group text-sm font-bold ${
                isActive
                  ? "bg-primary text-white shadow-button"
                  : "text-gray-text hover:text-foreground hover:bg-section"
              }`}
            >
              <item.icon
                className={`w-5 h-5 shrink-0 ${
                  isActive ? "text-white" : "text-muted group-hover:text-foreground"
                }`}
              />
              <span className="truncate">{item.name}</span>
            </Link>
          );
        })}

        {/* Logout Section */}
        <div className="pt-6 mt-6 border-t border-border">
          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-red-600 hover:bg-red-50 group text-left text-sm font-bold"
          >
            <LogOut className="w-5 h-5 shrink-0 text-red-500" />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
