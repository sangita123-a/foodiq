"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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
  LogOut 
} from "lucide-react";

export default function PartnerSidebar() {
  const pathname = usePathname();

  const menuItems = [
    { name: "Dashboard", icon: LayoutDashboard, href: "/partner/dashboard" },
    { name: "Orders", icon: ShoppingBag, href: "/partner/orders" },
    { name: "Menu Management", icon: UtensilsCrossed, href: "/partner/menu" },
    { name: "Add New Dish", icon: PlusCircle, href: "/partner/menu/add-dish" },
    { name: "Customers", icon: Users, href: "/partner/customers" },
    { name: "Reviews", icon: Star, href: "/partner/reviews" },
    { name: "Offers & Discounts", icon: Tag, href: "/partner/offers" },
    { name: "Earnings", icon: DollarSign, href: "/partner/earnings" },
    { name: "Analytics", icon: BarChart3, href: "/partner/analytics" },
  ];

  return (
    <div className="w-64 bg-[#171717] h-screen border-r border-white/5 flex flex-col fixed left-0 top-0 z-40">
      
      {/* Logo */}
      <div className="h-20 flex items-center px-6 border-b border-white/5">
        <Link href="/partner/dashboard" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center font-black text-white text-xl">
            F
          </div>
          <span className="text-xl font-black text-white tracking-tight">Foodiq <span className="text-primary text-sm uppercase tracking-widest font-bold ml-1 border border-primary/30 px-1.5 py-0.5 rounded">Partner</span></span>
        </Link>
      </div>

      {/* Menu Items */}
      <div className="flex-1 overflow-y-auto py-6 px-4 space-y-1 custom-scrollbar">
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                isActive 
                  ? "bg-primary text-white shadow-[0_0_15px_rgba(255,45,59,0.3)]" 
                  : "text-gray-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <item.icon className={`w-5 h-5 ${isActive ? "text-white" : "text-gray-500 group-hover:text-white"}`} />
              <span className="font-bold text-sm">{item.name}</span>
            </Link>
          );
        })}

        <div className="pt-6 mt-6 border-t border-white/5 space-y-1">
          <Link
            href="/partner/settings"
            className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-gray-400 hover:text-white hover:bg-white/5 group"
          >
            <Settings className="w-5 h-5 text-gray-500 group-hover:text-white" />
            <span className="font-bold text-sm">Restaurant Settings</span>
          </Link>
          
          <Link
            href="/partner/login"
            className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-red-500 hover:bg-red-500/10 group mt-2"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-bold text-sm">Logout</span>
          </Link>
        </div>
      </div>

    </div>
  );
}
