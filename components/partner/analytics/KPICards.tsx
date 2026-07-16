"use client";

import { useEffect, useRef } from "react";
import { motion, useInView, useSpring, useTransform } from "framer-motion";
import { Package, DollarSign, TrendingUp, TrendingDown, Users, Star, Flame, Clock, Tag } from "lucide-react";
import { KPIStats } from "./types";

function Counter({ from, to, duration = 2, prefix = "", suffix = "", isDecimal = false, isString = false, stringVal = "" }: { from: number, to: number, duration?: number, prefix?: string, suffix?: string, isDecimal?: boolean, isString?: boolean, stringVal?: string }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });
  
  const spring = useSpring(from, { duration: duration * 1000, bounce: 0 });
  const display = useTransform(spring, (latest) => {
    if (isString) return stringVal;
    if (isDecimal) return `${prefix}${latest.toFixed(1)}${suffix}`;
    return `${prefix}${Math.round(latest).toLocaleString()}${suffix}`;
  });

  useEffect(() => {
    if (isInView && !isString) {
      spring.set(to);
    }
  }, [isInView, spring, to, isString]);

  if (isString) {
    return <span>{stringVal}</span>;
  }

  return <motion.span ref={ref}>{display}</motion.span>;
}

// Mini Sparkline SVG Component
function Sparkline({ isUp }: { isUp: boolean }) {
  const color = isUp ? "var(--color-green-500, #22c55e)" : "var(--color-red-500, #ef4444)";
  const points = isUp 
    ? "0,20 5,15 10,18 15,10 20,12 25,5 30,8 35,0" 
    : "0,0 5,5 10,2 15,10 20,8 25,15 30,12 35,20";
    
  return (
    <svg width="60" height="20" viewBox="0 0 35 20" fill="none" xmlns="http://www.w3.org/2000/svg" className="ml-auto opacity-50 group-hover:opacity-100 transition-opacity">
      <motion.polyline 
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1.5, ease: "easeOut" }}
        points={points} 
        stroke={color} 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
      />
    </svg>
  );
}

interface KPICardsProps {
  data: KPIStats;
}

export default function KPICards({ data }: KPICardsProps) {
  
  const stats = [
    { title: "Total Orders", value: data.totalOrders, icon: Package, color: "text-blue-400", bg: "bg-blue-400/10", border: "border-blue-400/20", trend: data.totalOrdersGrowth, prefix: "" },
    { title: "Total Revenue", value: data.totalRevenue, icon: DollarSign, color: "text-green-400", bg: "bg-green-400/10", border: "border-green-400/20", trend: data.revenueGrowth, prefix: "₹" },
    { title: "Revenue Growth", value: data.revenueGrowth, icon: TrendingUp, color: "text-purple-400", bg: "bg-purple-400/10", border: "border-purple-400/20", trend: 5, prefix: "", suffix: "%" }, // arbitrary trend for the growth itself
    { title: "New Customers", value: data.newCustomers, icon: Users, color: "text-pink-400", bg: "bg-pink-400/10", border: "border-pink-400/20", trend: data.newCustomersGrowth, prefix: "" },
    
    { title: "Average Rating", value: data.averageRating, icon: Star, color: "text-yellow-400", bg: "bg-yellow-400/10", border: "border-yellow-400/20", trend: data.averageRatingGrowth, prefix: "", isDecimal: true },
    { title: "Best Selling Dish", value: 0, icon: Flame, color: "text-orange-400", bg: "bg-orange-400/10", border: "border-orange-400/20", trend: 12, prefix: "", isString: true, stringVal: data.bestSellingDish },
    { title: "Avg Delivery Time", value: data.avgDeliveryTime, icon: Clock, color: "text-cyan-400", bg: "bg-cyan-400/10", border: "border-cyan-400/20", trend: data.avgDeliveryTimeGrowth, prefix: "", suffix: "m", inverseGood: true },
    { title: "Avg Order Value", value: data.averageOrderValue, icon: Tag, color: "text-indigo-400", bg: "bg-indigo-400/10", border: "border-indigo-400/20", trend: data.aovGrowth, prefix: "₹" }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {stats.map((stat, idx) => {
        const isUp = stat.inverseGood ? stat.trend <= 0 : stat.trend >= 0;
        const trendDisplay = stat.trend > 0 ? `+${stat.trend}%` : `${stat.trend}%`;
        
        return (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: idx * 0.05 }}
            whileHover={{ y: -5 }}
            className="bg-[#171717] rounded-2xl p-5 border border-white/5 shadow-lg group hover:border-white/20 transition-all cursor-default relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-t from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            
            <div className="relative z-10 flex flex-col h-full justify-between">
              
              <div className="flex items-start justify-between mb-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${stat.bg} ${stat.border} border`}>
                  <stat.icon className={`w-5 h-5 ${stat.color} ${stat.title === 'Average Rating' ? 'fill-yellow-400' : ''}`} />
                </div>
                
                <div className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-md bg-[#111] border border-white/5 ${isUp ? 'text-green-400' : 'text-red-400'}`}>
                  {isUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  {trendDisplay}
                </div>
              </div>

              <div>
                <h3 className={`font-black text-white mb-1 ${stat.isString ? 'text-lg line-clamp-1' : 'text-3xl'}`}>
                  <Counter 
                    from={0} 
                    to={stat.value} 
                    prefix={stat.prefix} 
                    suffix={stat.suffix} 
                    isDecimal={stat.isDecimal} 
                    isString={stat.isString} 
                    stringVal={stat.stringVal} 
                  />
                </h3>
                <div className="flex items-center justify-between">
                  <p className="text-gray-400 text-xs font-bold uppercase tracking-wider">{stat.title}</p>
                  <Sparkline isUp={isUp} />
                </div>
              </div>

            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
