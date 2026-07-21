"use client";

import { motion } from "framer-motion";
import { Clock, Activity, CheckCircle2, XCircle } from "lucide-react";
import { OrderAnalyticsData } from "./types";

interface OrderAnalyticsProps {
  data: OrderAnalyticsData;
}

// Circular Progress Component
function CircularProgress({ percentage, color, label, icon: Icon }: { percentage: number, color: string, label: string, icon: any }) {
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-24 h-24 flex items-center justify-center mb-3 group">
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
          {/* Background circle */}
          <circle 
            cx="50" cy="50" r={radius} 
            fill="transparent" 
            stroke="rgba(255,255,255,0.05)" 
            strokeWidth="8" 
          />
          {/* Progress circle */}
          <motion.circle 
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            cx="50" cy="50" r={radius} 
            fill="transparent" 
            stroke={color} 
            strokeWidth="8" 
            strokeDasharray={circumference}
            strokeLinecap="round"
            className="drop-shadow-[0_0_8px_rgba(255,255,255,0.2)] group-hover:drop-shadow-[0_0_12px_rgba(255,255,255,0.4)] transition-all"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <Icon className="w-5 h-5 mb-0.5" style={{ color }} />
          <span className="text-foreground font-black text-sm">{percentage}%</span>
        </div>
      </div>
      <span className="text-gray-text text-xs font-bold uppercase tracking-wider text-center">{label}</span>
    </div>
  );
}

export default function OrderAnalytics({ data }: OrderAnalyticsProps) {
  
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
      
      {/* Orders by Hour Chart */}
      <div className="lg:col-span-2 bg-background rounded-3xl p-6 md:p-8 border border-border shadow-xl">
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-xl font-black text-foreground flex items-center gap-2">
            <Activity className="w-6 h-6 text-purple-500" /> Hourly Order Volume
          </h3>
          <div className="bg-purple-500/10 text-purple-400 text-xs font-bold px-3 py-1.5 rounded-lg border border-purple-500/20 flex items-center gap-2">
            <Clock className="w-3 h-3" /> Peak: {data.peakHour}
          </div>
        </div>
        
        <div className="h-48 flex items-end justify-between gap-1 pt-4 border-b border-border pb-2">
          {data.ordersByHour.map((d, idx) => (
            <div key={idx} className="flex-1 flex flex-col items-center justify-end h-full group relative">
              <div className="absolute -top-8 opacity-0 group-hover:opacity-100 transition-opacity bg-section border border-border text-foreground text-[10px] font-bold px-2 py-1 rounded whitespace-nowrap z-20">
                {d.count} Orders
              </div>
              
              <motion.div 
                initial={{ height: 0 }}
                animate={{ height: d.height }}
                transition={{ duration: 1, delay: idx * 0.05, type: "spring" }}
                className={`w-full max-w-[20px] rounded-t-sm transition-colors ${d.hour === data.peakHour.split(' ')[0] ? 'bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.4)]' : 'bg-section border-t border-x border-border group-hover:bg-purple-500/50'}`}
              />
            </div>
          ))}
        </div>
        
        <div className="flex justify-between pt-2">
          {/* Show a few labels for clarity */}
          {data.ordersByHour.filter((_, i) => i % 3 === 0).map((d, idx) => (
            <div key={idx} className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-wider text-center w-8">
              {d.hour}
            </div>
          ))}
        </div>
      </div>

      {/* Completion Rates */}
      <div className="bg-background rounded-3xl p-6 md:p-8 border border-border shadow-xl flex flex-col">
        <h3 className="text-xl font-black text-foreground flex items-center gap-2 mb-8">
          <CheckCircle2 className="w-6 h-6 text-green-500" /> Order Fulfillment
        </h3>
        
        <div className="flex-1 flex items-center justify-around">
          <CircularProgress 
            percentage={data.completionRate} 
            color="#22c55e" 
            label="Completion Rate" 
            icon={CheckCircle2} 
          />
          <CircularProgress 
            percentage={data.cancellationRate} 
            color="#ef4444" 
            label="Cancellation Rate" 
            icon={XCircle} 
          />
        </div>
        
        <div className="mt-8 bg-section p-4 rounded-xl border border-border">
          <p className="text-sm text-gray-text text-center leading-relaxed">
            Your completion rate is <strong className="text-green-400">Excellent</strong>. You are in the top 5% of restaurants in your area.
          </p>
        </div>
      </div>

    </div>
  );
}
