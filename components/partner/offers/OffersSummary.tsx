"use client";

import { useEffect, useRef } from "react";
import { motion, useInView, useSpring, useTransform } from "framer-motion";
import { Ticket, CalendarClock, Clock, Tag, DollarSign, TrendingUp, TrendingDown } from "lucide-react";
import { OffersAnalyticsData } from "./types";

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

interface OffersSummaryProps {
  data: OffersAnalyticsData;
}

export default function OffersSummary({ data }: OffersSummaryProps) {
  
  const stats = [
    { title: "Active Offers", value: data.activeOffers, icon: Ticket, color: "text-green-400", bg: "bg-green-400/10", border: "border-green-400/20", trend: "+2", isUp: true, prefix: "" },
    { title: "Scheduled Offers", value: data.scheduledOffers, icon: CalendarClock, color: "text-yellow-400", bg: "bg-yellow-400/10", border: "border-yellow-400/20", trend: "+1", isUp: true, prefix: "" },
    { title: "Expired Offers", value: data.expiredOffers, icon: Clock, color: "text-red-400", bg: "bg-red-400/10", border: "border-red-400/20", trend: "-5", isUp: true, prefix: "" }, // Fewer expired is good
    { title: "Coupon Redemptions", value: data.totalRedemptions, icon: Tag, color: "text-purple-400", bg: "bg-purple-400/10", border: "border-purple-400/20", trend: "+12%", isUp: true, prefix: "" },
    { title: "Revenue from Promos", value: data.revenueFromPromotions, icon: DollarSign, color: "text-blue-400", bg: "bg-blue-400/10", border: "border-blue-400/20", trend: "+24%", isUp: true, prefix: "₹" }
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

            <h3 className="text-2xl xl:text-3xl font-black text-foreground mb-1">
              <Counter from={0} to={stat.value} prefix={stat.prefix} />
            </h3>
            <p className="text-gray-text text-xs font-bold uppercase tracking-wider line-clamp-1">{stat.title}</p>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
