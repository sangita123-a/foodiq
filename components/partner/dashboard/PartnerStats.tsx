"use client";

import { useEffect, useRef } from "react";
import { motion, useInView, useSpring, useTransform } from "framer-motion";
import { ShoppingBag, DollarSign, Clock, CheckCircle2, UtensilsCrossed } from "lucide-react";

function Counter({ from, to, duration = 2, prefix = "", suffix = "", decimals = 0 }: { from: number, to: number, duration?: number, prefix?: string, suffix?: string, decimals?: number }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });
  
  const spring = useSpring(from, { duration: duration * 1000, bounce: 0 });
  
  const formatted = useTransform(spring, (latest) => {
    const num = latest.toFixed(decimals);
    const parts = num.split(".");
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return `${prefix}${parts.join(".")}${suffix}`;
  });

  useEffect(() => {
    if (isInView) {
      spring.set(to);
    }
  }, [isInView, spring, to]);

  return <motion.span ref={ref}>{formatted}</motion.span>;
}

type PartnerStatsProps = {
  totalOrders?: number;
  todaysOrders?: number;
  todaysRevenue?: number;
  pendingOrders?: number;
  completedOrders?: number;
  activeMenuItems?: number;
};

export default function PartnerStats({
  totalOrders = 0,
  todaysOrders = 0,
  todaysRevenue = 0,
  pendingOrders = 0,
  completedOrders = 0,
  activeMenuItems = 0,
}: PartnerStatsProps) {
  const stats: Array<{
    title: string;
    value: number;
    icon: typeof ShoppingBag;
    color: string;
    bg: string;
    border: string;
    prefix?: string;
    decimals?: number;
  }> = [
    { title: "Total Orders", value: totalOrders, icon: ShoppingBag, color: "text-blue-400", bg: "bg-blue-400/10", border: "border-blue-400/20" },
    { title: "Today's Orders", value: todaysOrders, icon: ShoppingBag, color: "text-sky-400", bg: "bg-sky-400/10", border: "border-sky-400/20" },
    { title: "Today's Revenue", value: todaysRevenue, prefix: "₹", icon: DollarSign, color: "text-green-400", bg: "bg-green-400/10", border: "border-green-400/20" },
    { title: "Pending Orders", value: pendingOrders, icon: Clock, color: "text-yellow-400", bg: "bg-yellow-400/10", border: "border-yellow-400/20" },
    { title: "Completed Orders", value: completedOrders, icon: CheckCircle2, color: "text-emerald-400", bg: "bg-emerald-400/10", border: "border-emerald-400/20" },
    { title: "Active Menu Items", value: activeMenuItems, icon: UtensilsCrossed, color: "text-[#FC8019]", bg: "bg-[#FC8019]/10", border: "border-[#FC8019]/20" },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
      {stats.map((stat, idx) => (
        <motion.div
          key={idx}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: idx * 0.1 }}
          whileHover={{ y: -5 }}
          className="bg-[#FFFFFF] rounded-2xl p-6 border border-[#E5E7EB] shadow-lg group hover:border-[#E5E7EB] transition-all cursor-pointer relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-t from-[#F8FAFC] to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
          
          <div className="flex items-center justify-between relative z-10">
            <div>
              <p className="text-[#6B7280] text-sm font-bold mb-1">{stat.title}</p>
              <h3 className="text-3xl font-black text-[#111827]">
                <Counter 
                  from={0} 
                  to={stat.value} 
                  prefix={stat.prefix} 
                  decimals={stat.decimals} 
                />
              </h3>
            </div>
            
            <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${stat.bg} ${stat.border} border`}>
              <stat.icon className={`w-7 h-7 ${stat.color}`} />
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
