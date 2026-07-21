"use client";

import { useEffect, useRef } from "react";
import { motion, useInView, useSpring, useTransform } from "framer-motion";
import { Utensils, CheckCircle, XCircle, TrendingUp } from "lucide-react";

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

type MenuSummaryProps = {
  total?: number;
  available?: number;
  outOfStock?: number;
  hidden?: number;
};

export default function MenuSummary({
  total = 0,
  available = 0,
  outOfStock = 0,
  hidden = 0,
}: MenuSummaryProps) {
  const stats = [
    { title: "Total Dishes", value: total, icon: Utensils, color: "text-blue-400", bg: "bg-blue-400/10", border: "border-blue-400/20" },
    { title: "Available", value: available, icon: CheckCircle, color: "text-green-400", bg: "bg-green-400/10", border: "border-green-400/20" },
    { title: "Out of Stock", value: outOfStock, icon: XCircle, color: "text-red-400", bg: "bg-red-400/10", border: "border-red-400/20" },
    { title: "Hidden / Draft", value: hidden, icon: TrendingUp, color: "text-yellow-400", bg: "bg-yellow-400/10", border: "border-yellow-400/20" }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
      {stats.map((stat, idx) => (
        <motion.div
          key={idx}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: idx * 0.1 }}
          whileHover={{ y: -5 }}
          className="bg-background rounded-2xl p-6 border border-border shadow-lg group hover:border-border transition-all cursor-pointer relative overflow-hidden"
        >
          {/* subtle background glow on hover */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#F8FAFC] to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
          
          <div className="flex items-center justify-between relative z-10">
            <div>
              <p className="text-gray-text text-sm font-bold mb-1">{stat.title}</p>
              <h3 className="text-3xl font-black text-foreground">
                <Counter from={0} to={stat.value} />
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
