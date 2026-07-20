"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useMemo } from "react";
import {
  LayoutDashboard,
  Store,
  Users,
  Bike,
  ShoppingBag,
  UtensilsCrossed,
  Ticket,
  BarChart3,
  Bell,
  Settings,
  LogOut,
  Wallet,
  Radio,
  Images,
  Activity,
  MessageSquare,
  Bug,
  Wrench,
  LineChart,
  Bot,
  Truck,
  Megaphone,
  FileText,
  Shield,
  UserCog,
  Gift,
  ClipboardList,
  Headphones,
  Package,
} from "lucide-react";
import { clearClientAuth } from "@/lib/authSession";
import {
  ADMIN_ROLE_LABELS,
  getStoredAdminRole,
  hasAdminPermission,
  type AdminRole,
} from "@/lib/adminPermissions";

type MenuItem = {
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  permission: string;
};

const menuItems: MenuItem[] = [
  { name: "Dashboard", icon: LayoutDashboard, href: "/admin/dashboard", permission: "dashboard" },
  { name: "Live Ops", icon: Radio, href: "/admin/live", permission: "live" },
  { name: "Monitoring", icon: Activity, href: "/admin/monitoring", permission: "monitoring" },
  { name: "BI", icon: LineChart, href: "/admin/bi", permission: "bi" },
  { name: "AI", icon: Bot, href: "/admin/ai", permission: "ai" },
  { name: "Fleet", icon: Truck, href: "/admin/fleet", permission: "fleet" },
  { name: "Orders", icon: ShoppingBag, href: "/admin/orders", permission: "orders" },
  { name: "Customers", icon: Users, href: "/admin/users", permission: "customers" },
  { name: "Restaurants", icon: Store, href: "/admin/restaurants", permission: "restaurants" },
  { name: "Inventory", icon: Package, href: "/admin/inventory", permission: "restaurants" },
  { name: "Delivery Partners", icon: Bike, href: "/admin/delivery-partners", permission: "delivery" },
  { name: "Menu", icon: UtensilsCrossed, href: "/admin/menu", permission: "menu" },
  { name: "Payments", icon: Wallet, href: "/admin/payments", permission: "payments" },
  { name: "Customer Wallet", icon: Wallet, href: "/admin/wallet", permission: "payments" },
  { name: "Coupons", icon: Ticket, href: "/admin/coupons", permission: "coupons" },
  { name: "Loyalty", icon: Gift, href: "/admin/loyalty", permission: "loyalty" },
  { name: "Marketing", icon: Megaphone, href: "/admin/marketing", permission: "marketing" },
  { name: "CMS", icon: FileText, href: "/admin/cms", permission: "cms" },
  { name: "Reports", icon: ClipboardList, href: "/admin/reports", permission: "reports" },
  { name: "Analytics", icon: BarChart3, href: "/admin/analytics", permission: "analytics" },
  { name: "Notifications", icon: Bell, href: "/admin/notifications", permission: "notifications" },
  { name: "Push Notifications", icon: Bell, href: "/admin/push-notifications", permission: "notifications" },
  { name: "Support Center", icon: Headphones, href: "/admin/support", permission: "feedback" },
  { name: "Feedback", icon: MessageSquare, href: "/admin/feedback", permission: "feedback" },
  { name: "Bugs", icon: Bug, href: "/admin/bugs", permission: "bugs" },
  { name: "Maintenance", icon: Wrench, href: "/admin/maintenance", permission: "maintenance" },
  { name: "Media Library", icon: Images, href: "/admin/media", permission: "media" },
  { name: "Security", icon: Shield, href: "/admin/security", permission: "security" },
  { name: "Admin Staff", icon: UserCog, href: "/admin/staff", permission: "staff" },
  { name: "Settings", icon: Settings, href: "/admin/settings", permission: "settings" },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const adminRole = getStoredAdminRole();

  const visibleItems = useMemo(() => {
    return menuItems.filter((item) =>
      hasAdminPermission("admin", adminRole, item.permission)
    );
  }, [adminRole]);

  const handleLogout = () => {
    clearClientAuth();
    router.push("/admin/login");
  };

  return (
    <div className="w-64 bg-[#FFFFFF] h-screen border-r border-[#E5E7EB] flex flex-col fixed left-0 top-0 z-40">
      <div className="h-20 flex items-center px-6 border-b border-[#E5E7EB]">
        <Link href="/admin/dashboard" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-[#E23744] rounded-lg flex items-center justify-center font-black text-white text-xl">
            F
          </div>
          <div>
            <span className="text-xl font-black text-[#111827] tracking-tight block">
              Foodiq
            </span>
            <span className="text-[10px] uppercase tracking-widest font-bold text-[#E23744]">
              Enterprise Admin
            </span>
          </div>
        </Link>
      </div>

      {adminRole && (
        <div className="px-4 py-3 border-b border-[#E5E7EB]">
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#9CA3AF] mb-1">
            Role
          </p>
          <p className="text-xs font-black text-[#111827]">
            {ADMIN_ROLE_LABELS[adminRole as AdminRole] || adminRole}
          </p>
        </div>
      )}

      <div className="flex-1 overflow-y-auto py-4 px-3 space-y-0.5 custom-scrollbar">
        {visibleItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group ${
                isActive
                  ? "bg-[#E23744] text-white shadow-[0_0_15px_rgba(226,55,68,0.3)]"
                  : "text-[#6B7280] hover:text-[#111827] hover:bg-[#F8FAFC]"
              }`}
            >
              <item.icon
                className={`w-4 h-4 shrink-0 ${isActive ? "text-white" : "text-[#9CA3AF] group-hover:text-[#111827]"}`}
              />
              <span className="font-bold text-xs">{item.name}</span>
            </Link>
          );
        })}

        <div className="pt-4 mt-4 border-t border-[#E5E7EB]">
          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 text-red-500 hover:bg-red-500/10 text-left"
          >
            <LogOut className="w-4 h-4" />
            <span className="font-bold text-xs">Logout</span>
          </button>
        </div>
      </div>
    </div>
  );
}
