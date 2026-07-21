"use client";

import { useEffect, useRef } from "react";
import { motion, useInView, useSpring, useTransform } from "framer-motion";
import { Star, MessageSquare, Smile, Meh, Frown, TrendingUp, TrendingDown } from "lucide-react";
import { ReviewsAnalyticsData } from "./types";

function Counter({ from, to, duration = 2, isDecimal = false }: { from: number, to: number, duration?: number, isDecimal?: boolean }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });
  
  const spring = useSpring(from, { duration: duration * 1000, bounce: 0 });
  
  const display = useTransform(spring, (latest) => 
    isDecimal ? latest.toFixed(1) : Math.round(latest).toLocaleString()
  );

  useEffect(() => {
    if (isInView) {
      spring.set(to);
    }
  }, [isInView, spring, to]);

  return <motion.span ref={ref}>{display}</motion.span>;
}

interface ReviewsSummaryProps {
  data: ReviewsAnalyticsData;
}

export default function ReviewsSummary({ data }: ReviewsSummaryProps) {
  
  const stats = [
    { title: "Average Rating", value: data.averageRating, icon: Star, color: "text-yellow-400", bg: "bg-yellow-400/10", border: "border-yellow-400/20", trend: "+0.2", isUp: true, isDecimal: true },
    { title: "Total Reviews", value: data.totalReviews, icon: MessageSquare, color: "text-blue-400", bg: "bg-blue-400/10", border: "border-blue-400/20", trend: "+15%", isUp: true },
    { title: "Positive Reviews", value: data.positiveReviews, icon: Smile, color: "text-green-400", bg: "bg-green-400/10", border: "border-green-400/20", trend: "+5%", isUp: true },
    { title: "Neutral Reviews", value: data.neutralReviews, icon: Meh, color: "text-primary", bg: "bg-primary/10", border: "border-primary/20", trend: "-2%", isUp: false },
    { title: "Negative Reviews", value: data.negativeReviews, icon: Frown, color: "text-red-400", bg: "bg-red-400/10", border: "border-red-400/20", trend: "-8%", isUp: true } // Down is good here, so isUp=true for green color
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
                <stat.icon className={`w-5 h-5 ${stat.color} ${stat.title === 'Average Rating' ? 'fill-yellow-400' : ''}`} />
              </div>
              
              <div className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-md bg-section border border-border ${stat.isUp ? 'text-green-400' : 'text-red-400'}`}>
                {stat.isUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {stat.trend}
              </div>
            </div>

            <h3 className="text-3xl font-black text-foreground mb-1 flex items-center gap-2">
              <Counter from={0} to={stat.value} isDecimal={stat.isDecimal} />
              {stat.title === 'Average Rating' && <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />}
            </h3>
            <p className="text-gray-text text-xs font-bold uppercase tracking-wider">{stat.title}</p>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
