"use client";

import { useEffect, useRef } from "react";
import { motion, useInView, useSpring, useTransform } from "framer-motion";
import { Bell, ChefHat, PackageCheck, Bike, CheckCircle2, TrendingUp, TrendingDown } from "lucide-react";
import { Order } from "./types";

function Counter({ from, to, duration = 2 }: { from: number, to: number, duration?: number }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });
  
  const spring = useSpring(from, { duration: duration * 1000, bounce: 0 });
  const rounded = useTransform(spring, (latest) => Math.round(latest));

  useEffect(() => {
    if (isInView) {
      spring.set(to);
    }
  }, [isInView, spring, to]);

  return <motion.span ref={ref}>{rounded}</motion.span>;
}

interface OrdersSummaryProps {
  orders: Order[];
}

export default function OrdersSummary({ orders }: OrdersSummaryProps) {
  const newOrders = orders.filter(o => o.status === "New").length;
  const preparing = orders.filter(o => o.status === "Preparing" || o.status === "Accepted").length;
  const ready = orders.filter(o => o.status === "Ready for Pickup").length;
  const pickedUp = orders.filter(o => o.status === "Picked Up").length;
  const completed = orders.filter(o => o.status === "Delivered").length + pickedUp; // Simplified logic for demo

  const stats = [
    { title: "New Orders", value: newOrders, icon: Bell, color: "text-yellow-400", bg: "bg-yellow-400/10", border: "border-yellow-400/20", trend: "+2", isUp: true },
    { title: "Preparing", value: preparing, icon: ChefHat, color: "text-primary", bg: "bg-primary/10", border: "border-primary/20", trend: "-1", isUp: false },
    { title: "Ready for Pickup", value: ready, icon: PackageCheck, color: "text-purple-400", bg: "bg-purple-400/10", border: "border-purple-400/20", trend: "+5", isUp: true },
    { title: "Picked Up", value: pickedUp, icon: Bike, color: "text-blue-400", bg: "bg-blue-400/10", border: "border-blue-400/20", trend: "+12", isUp: true },
    { title: "Completed Today", value: completed, icon: CheckCircle2, color: "text-green-400", bg: "bg-green-400/10", border: "border-green-400/20", trend: "+24%", isUp: true }
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
          className="bg-background rounded-2xl p-5 border border-border shadow-lg group hover:border-border transition-all cursor-pointer relative overflow-hidden"
        >
          {/* subtle background glow on hover */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#F8FAFC] to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
          
          <div className="relative z-10">
            <div className="flex items-start justify-between mb-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${stat.bg} ${stat.border} border`}>
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              
              <div className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-md bg-section border border-border ${stat.isUp ? 'text-green-400' : 'text-red-400'}`}>
                {stat.isUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {stat.trend}
              </div>
            </div>

            <h3 className="text-3xl font-black text-foreground mb-1">
              <Counter from={0} to={stat.value} />
            </h3>
            <p className="text-gray-text text-xs font-bold uppercase tracking-wider">{stat.title}</p>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
