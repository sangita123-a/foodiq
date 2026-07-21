"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  ShoppingBag,
  UtensilsCrossed,
  PlusCircle,
  Users,
  Star,
  Tag,
  DollarSign,
  BarChart3,
  Settings,
  LogOut,
  Bell,
  Package,
  ChefHat,
  BookOpen,
  Truck,
  ClipboardList,
} from "lucide-react";
import { clearClientAuth } from "@/lib/authSession";

export default function PartnerSidebar({
  variant = "fixed",
  onNavigate,
}: {
  variant?: "fixed" | "drawer";
  onNavigate?: () => void;
} = {}) {
  const pathname = usePathname();
  const router = useRouter();

  const menuItems = [
    { name: "Dashboard", icon: LayoutDashboard, href: "/partner/dashboard" },
    { name: "Orders", icon: ShoppingBag, href: "/partner/orders" },
    { name: "Kitchen", icon: ChefHat, href: "/partner/kitchen" },
    { name: "Menu Management", icon: UtensilsCrossed, href: "/partner/menu" },
    { name: "Inventory", icon: Package, href: "/partner/inventory" },
    { name: "Recipes", icon: BookOpen, href: "/partner/recipes" },
    { name: "Suppliers", icon: Truck, href: "/partner/suppliers" },
    { name: "Inv. Reports", icon: ClipboardList, href: "/partner/inventory-reports" },
    { name: "Add New Dish", icon: PlusCircle, href: "/partner/menu/add-dish" },
    { name: "Customers", icon: Users, href: "/partner/customers" },
    { name: "Reviews", icon: Star, href: "/partner/reviews" },
    { name: "Offers & Discounts", icon: Tag, href: "/partner/offers" },
    { name: "Earnings", icon: DollarSign, href: "/partner/earnings" },
    { name: "Analytics", icon: BarChart3, href: "/partner/analytics" },
    { name: "Notifications", icon: Bell, href: "/partner/notifications" },
  ];

  const handleLogout = () => {
    clearClientAuth();
    router.push("/partner/login");
  };

  return (
    <div
      className={`w-64 bg-background h-full border-r border-border flex flex-col ${
        variant === "fixed" ? "h-screen fixed left-0 top-0 z-40" : "relative"
      }`}
    >

      <div className="h-20 flex items-center px-6 border-b border-border">
        <Link href="/partner/dashboard" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center font-black text-white text-xl">
            F
          </div>
          <span className="text-xl font-black text-foreground tracking-tight">Foodiq <span className="text-primary text-sm uppercase tracking-widest font-bold ml-1 border border-primary/30 px-1.5 py-0.5 rounded">Partner</span></span>
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto py-6 px-4 space-y-1 custom-scrollbar">
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={onNavigate}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                isActive
                  ? "bg-primary text-white shadow-[0_0_15px_rgba(226, 55, 68,0.3)]"
                  : "text-gray-text hover:text-foreground hover:bg-section"
              }`}
            >
              <item.icon className={`w-5 h-5 ${isActive ? "text-foreground" : "text-[#9CA3AF] group-hover:text-foreground"}`} />
              <span className="font-bold text-sm">{item.name}</span>
            </Link>
          );
        })}

        <div className="pt-6 mt-6 border-t border-border space-y-1">
          <Link
            href="/partner/settings"
            onClick={onNavigate}
            className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-gray-text hover:text-foreground hover:bg-section group"
          >
            <Settings className="w-5 h-5 text-[#9CA3AF] group-hover:text-foreground" />
            <span className="font-bold text-sm">Restaurant Settings</span>
          </Link>

          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-red-500 hover:bg-red-500/10 group mt-2 text-left"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-bold text-sm">Logout</span>
          </button>
        </div>
      </div>

    </div>
  );
}
