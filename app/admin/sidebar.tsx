"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, ShoppingCart, UtensilsCrossed, Bike, Users, LogOut, Menu } from "lucide-react";
import Cookies from "js-cookie";

const navigation = [
  { name: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
  { name: "Orders", href: "/admin/orders", icon: ShoppingCart },
  { name: "Restaurants", href: "/admin/restaurants", icon: UtensilsCrossed },
  { name: "Riders", href: "/admin/riders", icon: Bike },
  { name: "Customers", href: "/admin/customers", icon: Users },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isOpen, setIsOpen] = React.useState(false);

  const handleSignOut = () => {
    Cookies.remove("token");
    Cookies.remove("foodiq_session");
    router.push("/admin/login");
  };

  return (
    <>
      {/* Mobile Header */}
      <header className="md:hidden h-16 flex items-center justify-between px-4 bg-gray-900 border-b border-gray-800">
        <span className="text-xl font-bold text-white">Foodiq</span>
        <button 
          className="p-2 text-gray-400 hover:text-white"
          onClick={() => setIsOpen(!isOpen)}
        >
          <Menu className="h-6 w-6" />
        </button>
      </header>

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-gray-900 border-r border-gray-800 transform transition-transform duration-200 ease-in-out md:relative md:translate-x-0
        ${isOpen ? "translate-x-0" : "-translate-x-full"}
      `}>
        <div className="flex flex-col h-full">
          <div className="h-16 flex items-center justify-between px-6 border-b border-gray-800">
            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-orange-400 to-red-500">
              Foodiq Admin
            </span>
            <button className="md:hidden text-gray-400" onClick={() => setIsOpen(false)}>
              ✕
            </button>
          </div>
          
          <nav className="flex-1 overflow-y-auto py-4">
            <ul className="space-y-1 px-3">
              {navigation.map((item) => {
                const isActive = pathname.startsWith(item.href);
                return (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      onClick={() => setIsOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                        isActive ? "bg-orange-500/10 text-orange-500" : "text-gray-400 hover:text-white hover:bg-gray-800"
                      }`}
                    >
                      <item.icon className="h-5 w-5" />
                      {item.name}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
          
          <div className="p-4 border-t border-gray-800">
            <button
              className="flex items-center gap-3 px-3 py-2 w-full rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
              onClick={handleSignOut}
            >
              <LogOut className="h-5 w-5" />
              Sign Out
            </button>
          </div>
        </div>
      </aside>

      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}
