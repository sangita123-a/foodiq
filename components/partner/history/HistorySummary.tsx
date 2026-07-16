"use client";

import { useEffect, useRef } from "react";
import { motion, useInView, useSpring, useTransform } from "framer-motion";
import { Package, CheckCircle2, XCircle, DollarSign, Calculator } from "lucide-react";
import { Order } from "@/components/partner/orders/types";

function Counter({ from, to, duration = 2, prefix = "" }: { from: number, to: number, duration?: number, prefix?: string }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });
  
  const spring = useSpring(from, { duration: duration * 1000, bounce: 0 });
  const rounded = useTransform(spring, (latest) => Math.round(latest));
  const display = useTransform(rounded, (latest) => `${prefix}${latest.toLocaleString()}`);

  useEffect(() => {
    if (isInView) {
      spring.set(to);
    }
  }, [isInView, spring, to]);

  return <motion.span ref={ref}>{display}</motion.span>;
}

interface HistorySummaryProps {
  orders: Order[];
}

export default function HistorySummary({ orders }: HistorySummaryProps) {
  
  const totalOrders = orders.length;
  const completedOrders = orders.filter(o => o.status === "Delivered").length;
  const cancelledOrders = orders.filter(o => o.status === "Rejected").length;
  
  const totalRevenue = orders
    .filter(o => o.status === "Delivered")
    .reduce((sum, o) => sum + o.grandTotal, 0);
    
  const averageOrderValue = completedOrders > 0 ? Math.round(totalRevenue / completedOrders) : 0;

  const stats = [
    { title: "Total Orders", value: totalOrders, icon: Package, color: "text-blue-400", bg: "bg-blue-400/10", border: "border-blue-400/20", prefix: "" },
    { title: "Completed Orders", value: completedOrders, icon: CheckCircle2, color: "text-green-400", bg: "bg-green-400/10", border: "border-green-400/20", prefix: "" },
    { title: "Cancelled Orders", value: cancelledOrders, icon: XCircle, color: "text-red-400", bg: "bg-red-400/10", border: "border-red-400/20", prefix: "" },
    { title: "Total Revenue", value: totalRevenue, icon: DollarSign, color: "text-yellow-400", bg: "bg-yellow-400/10", border: "border-yellow-400/20", prefix: "₹" },
    { title: "Average Order Value", value: averageOrderValue, icon: Calculator, color: "text-purple-400", bg: "bg-purple-400/10", border: "border-purple-400/20", prefix: "₹" }
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
      {stats.map((stat, idx) => (
        <motion.div
          key={idx}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: idx * 0.1 }}
          whileHover={{ y: -5 }}
          className="bg-[#171717] rounded-2xl p-5 border border-white/5 shadow-lg group hover:border-white/20 transition-all cursor-pointer relative overflow-hidden"
        >
          {/* subtle background glow on hover */}
          <div className="absolute inset-0 bg-gradient-to-t from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
          
          <div className="relative z-10">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${stat.bg} ${stat.border} border`}>
              <stat.icon className={`w-5 h-5 ${stat.color}`} />
            </div>

            <h3 className="text-3xl font-black text-white mb-1">
              <Counter from={0} to={stat.value} prefix={stat.prefix} />
            </h3>
            <p className="text-gray-400 text-xs font-bold uppercase tracking-wider">{stat.title}</p>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
