"use client";

import { motion } from "framer-motion";
import { PlusCircle, UtensilsCrossed, ShoppingBag, Tag } from "lucide-react";
import Link from "next/link";

export default function QuickActions() {
  const actions = [
    { name: "Add New Dish", icon: PlusCircle, href: "/partner/menu/add", color: "bg-[#FC8019]" },
    { name: "Manage Menu", icon: UtensilsCrossed, href: "/partner/menu", color: "bg-[#FFFFFF]" },
    { name: "View Orders", icon: ShoppingBag, href: "/partner/orders", color: "bg-[#FFFFFF]" },
    { name: "Create Offer", icon: Tag, href: "/partner/offers/create", color: "bg-[#FFFFFF]" }
  ];

  return (
    <div className="mb-8">
      <h2 className="text-xl font-bold text-[#111827] mb-4">Quick Actions</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {actions.map((action, idx) => (
          <Link key={idx} href={action.href}>
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`${action.color} ${action.color === 'bg-[#FC8019]' ? 'text-white hover:bg-[#E66F0D]' : 'text-[#6B7280] hover:text-[#111827] hover:bg-[#F8FAFC]'} rounded-2xl p-4 flex flex-col items-center justify-center text-center transition-colors border border-[#E5E7EB] h-32 cursor-pointer shadow-lg`}
            >
              <action.icon className="w-8 h-8 mb-3" />
              <span className="font-bold text-sm">{action.name}</span>
            </motion.div>
          </Link>
        ))}
      </div>
    </div>
  );
}
