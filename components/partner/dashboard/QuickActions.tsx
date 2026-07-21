"use client";

import { motion } from "framer-motion";
import { PlusCircle, UtensilsCrossed, ShoppingBag, Tag } from "lucide-react";
import Link from "next/link";

export default function QuickActions() {
  const actions = [
    { name: "Add New Dish", icon: PlusCircle, href: "/partner/menu/add", color: "bg-primary" },
    { name: "Manage Menu", icon: UtensilsCrossed, href: "/partner/menu", color: "bg-background" },
    { name: "View Orders", icon: ShoppingBag, href: "/partner/orders", color: "bg-background" },
    { name: "Create Offer", icon: Tag, href: "/partner/offers/create", color: "bg-background" }
  ];

  return (
    <div className="mb-8">
      <h2 className="text-xl font-bold text-foreground mb-4">Quick Actions</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {actions.map((action, idx) => (
          <Link key={idx} href={action.href}>
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`${action.color} ${action.color === 'bg-primary' ? 'text-white hover:bg-primary-hover' : 'text-gray-text hover:text-foreground hover:bg-section'} rounded-2xl p-4 flex flex-col items-center justify-center text-center transition-colors border border-border h-32 cursor-pointer shadow-lg`}
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
