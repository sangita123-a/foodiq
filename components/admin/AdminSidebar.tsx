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
  Phone,
  ShieldCheck,
  Landmark,
  Star,
  MapPin,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
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
  /** Visual grouping only — does not affect routing or permission checks. */
  section: string;
};

const menuItems: MenuItem[] = [
  { name: "Dashboard", icon: LayoutDashboard, href: "/admin/dashboard", permission: "dashboard", section: "Overview" },
  { name: "Live Ops", icon: Radio, href: "/admin/live", permission: "live", section: "Overview" },
  { name: "Live Deliveries", icon: Bike, href: "/admin/live-deliveries", permission: "live", section: "Overview" },
  { name: "Monitoring", icon: Activity, href: "/admin/monitoring", permission: "monitoring", section: "Overview" },
  { name: "BI", icon: LineChart, href: "/admin/bi", permission: "bi", section: "Overview" },
  { name: "AI", icon: Bot, href: "/admin/ai", permission: "ai", section: "Overview" },
  { name: "AI Dispatch", icon: Bot, href: "/admin/dispatch", permission: "delivery", section: "Overview" },

  { name: "Orders", icon: ShoppingBag, href: "/admin/orders", permission: "orders", section: "Operations" },
  { name: "Restaurants", icon: Store, href: "/admin/restaurants", permission: "restaurants", section: "Operations" },
  { name: "Inventory", icon: Package, href: "/admin/inventory", permission: "restaurants", section: "Operations" },
  { name: "Menu", icon: UtensilsCrossed, href: "/admin/menu", permission: "menu", section: "Operations" },
  { name: "Fleet", icon: Truck, href: "/admin/fleet", permission: "fleet", section: "Operations" },
  { name: "Customers", icon: Users, href: "/admin/customers", permission: "customers", section: "Operations" },

  { name: "Delivery Partners", icon: Bike, href: "/admin/delivery-partners", permission: "delivery", section: "Delivery" },
  { name: "Delivery Zones", icon: MapPin, href: "/admin/delivery-zones", permission: "delivery", section: "Delivery" },
  { name: "Delivery KYC", icon: ShieldCheck, href: "/admin/delivery-documents", permission: "delivery", section: "Delivery" },
  { name: "Withdrawals", icon: Wallet, href: "/admin/withdrawals", permission: "delivery", section: "Delivery" },
  { name: "Delivery Bank Accounts", icon: Landmark, href: "/admin/delivery-bank-accounts", permission: "delivery", section: "Delivery" },
  { name: "Delivery Reviews", icon: Star, href: "/admin/delivery-reviews", permission: "delivery", section: "Delivery" },
  { name: "SOS Emergencies", icon: ShieldAlert, href: "/admin/emergency", permission: "delivery", section: "Delivery" },

  { name: "Payments", icon: Wallet, href: "/admin/payments", permission: "payments", section: "Finance & Growth" },
  { name: "Customer Wallet", icon: Wallet, href: "/admin/wallet", permission: "payments", section: "Finance & Growth" },
  { name: "Coupons", icon: Ticket, href: "/admin/coupons", permission: "coupons", section: "Finance & Growth" },
  { name: "Loyalty", icon: Gift, href: "/admin/loyalty", permission: "loyalty", section: "Finance & Growth" },
  { name: "Marketing", icon: Megaphone, href: "/admin/marketing", permission: "marketing", section: "Finance & Growth" },
  { name: "CMS", icon: FileText, href: "/admin/cms", permission: "cms", section: "Finance & Growth" },

  { name: "Reports", icon: ClipboardList, href: "/admin/reports", permission: "reports", section: "Insights" },
  { name: "Analytics", icon: BarChart3, href: "/admin/analytics", permission: "analytics", section: "Insights" },

  { name: "Notifications", icon: Bell, href: "/admin/notifications", permission: "notifications", section: "Communications" },
  { name: "Delivery Notifications", icon: Bell, href: "/admin/delivery/notifications", permission: "notifications", section: "Communications" },
  { name: "Push Notifications", icon: Bell, href: "/admin/push-notifications", permission: "notifications", section: "Communications" },
  { name: "Support Center", icon: Headphones, href: "/admin/support-center", permission: "feedback", section: "Communications" },
  { name: "Feedback", icon: MessageSquare, href: "/admin/feedback", permission: "feedback", section: "Communications" },

  { name: "Bugs", icon: Bug, href: "/admin/bugs", permission: "bugs", section: "System" },
  { name: "Maintenance", icon: Wrench, href: "/admin/maintenance", permission: "maintenance", section: "System" },
  { name: "Media Library", icon: Images, href: "/admin/media", permission: "media", section: "System" },
  { name: "Security", icon: Shield, href: "/admin/security", permission: "security", section: "System" },
  { name: "Admin Staff", icon: UserCog, href: "/admin/staff", permission: "staff", section: "System" },
  { name: "Contact Settings", icon: Phone, href: "/admin/contact-settings", permission: "settings", section: "System" },
  { name: "Settings", icon: Settings, href: "/admin/settings", permission: "settings", section: "System" },
];

type AdminSidebarProps = {
  variant?: "fixed" | "drawer";
  onNavigate?: () => void;
  collapsed?: boolean;
  onToggleCollapsed?: () => void;
};

export default function AdminSidebar({
  variant = "fixed",
  onNavigate,
  collapsed = false,
  onToggleCollapsed,
}: AdminSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const adminRole = getStoredAdminRole();
  // Mobile drawer always renders expanded — collapsing only applies to the fixed desktop rail.
  const isCollapsed = variant === "fixed" && collapsed;

  const visibleItems = useMemo(() => {
    return menuItems.filter((item) =>
      hasAdminPermission("admin", adminRole, item.permission)
    );
  }, [adminRole]);

  const groupedItems = useMemo(() => {
    const groups = new Map<string, MenuItem[]>();
    for (const item of visibleItems) {
      const list = groups.get(item.section) ?? [];
      list.push(item);
      groups.set(item.section, list);
    }
    return Array.from(groups.entries());
  }, [visibleItems]);

  const handleLogout = () => {
    clearClientAuth();
    router.push("/admin/login");
  };

  return (
    <div
      className={`bg-white h-full border-r border-border flex flex-col transition-all duration-300 ease-in-out ${
        variant === "fixed" ? "h-screen fixed left-0 top-0 z-40" : "relative w-64"
      } ${isCollapsed ? "w-20" : "w-64"}`}
    >
      <div className={`h-20 flex items-center border-b border-border ${isCollapsed ? "justify-center px-2" : "px-6"}`}>
        <Link href="/admin/dashboard" className="flex items-center gap-2.5 min-w-0" title="Foodiq Enterprise Admin">
          <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center font-black text-white text-xl shrink-0 shadow-[var(--shadow-admin-glow)]">
            F
          </div>
          {!isCollapsed && (
            <div className="min-w-0">
              <span className="text-xl font-black text-foreground tracking-tight block truncate leading-tight">
                Foodiq
              </span>
              <span className="text-[10px] uppercase tracking-widest font-bold text-primary">
                Enterprise Admin
              </span>
            </div>
          )}
        </Link>
      </div>

      {adminRole && !isCollapsed && (
        <div className="px-4 pt-4">
          <div className="flex items-center justify-between rounded-xl bg-section px-3 py-2.5">
            <div>
              <p className="text-[9px] font-bold uppercase tracking-widest text-[#9CA3AF] mb-0.5">Role</p>
              <p className="text-xs font-black text-foreground">
                {ADMIN_ROLE_LABELS[adminRole as AdminRole] || adminRole}
              </p>
            </div>
            <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" title="Session active" />
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto py-4 px-3 custom-scrollbar">
        {groupedItems.map(([section, items]) => (
          <div key={section} className="mb-1">
            {!isCollapsed && (
              <p className="px-3 pt-4 pb-1.5 text-[10px] font-black uppercase tracking-widest text-[#c1c4cb] first:pt-1">
                {section}
              </p>
            )}
            <div className="space-y-0.5">
              {items.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={onNavigate}
                    title={isCollapsed ? item.name : undefined}
                    className={`relative flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group ${
                      isCollapsed ? "justify-center" : ""
                    } ${
                      isActive
                        ? "bg-primary text-white shadow-[var(--shadow-admin-glow)]"
                        : "text-gray-text hover:text-foreground hover:bg-section"
                    }`}
                  >
                    <item.icon
                      className={`w-4 h-4 shrink-0 ${isActive ? "text-white" : "text-[#9CA3AF] group-hover:text-foreground"}`}
                    />
                    {!isCollapsed && <span className="font-bold text-xs truncate">{item.name}</span>}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}

        <div className="pt-4 mt-4 border-t border-border">
          <button
            type="button"
            onClick={handleLogout}
            title={isCollapsed ? "Logout" : undefined}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 text-red-500 hover:bg-red-50 text-left ${
              isCollapsed ? "justify-center" : ""
            }`}
          >
            <LogOut className="w-4 h-4 shrink-0" />
            {!isCollapsed && <span className="font-bold text-xs">Logout</span>}
          </button>
        </div>
      </div>

      {variant === "fixed" && onToggleCollapsed && (
        <button
          type="button"
          onClick={onToggleCollapsed}
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="flex items-center justify-center gap-2 h-11 border-t border-border text-[#9CA3AF] hover:text-foreground hover:bg-section transition-colors duration-200 shrink-0"
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : (
            <>
              <ChevronLeft className="w-4 h-4" />
              <span className="text-xs font-bold">Collapse</span>
            </>
          )}
        </button>
      )}
    </div>
  );
}
