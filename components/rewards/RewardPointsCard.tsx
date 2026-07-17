"use client";

import { motion } from "framer-motion";
import { Crown, Coins, TrendingUp } from "lucide-react";

type Props = {
  totalPoints: number;
  level: "Silver" | "Gold" | "Platinum";
  pointsToNextLevel: number;
  progressPercent: number;
  totalSavings: number;
  expiryDate: string;
  onRedeem?: () => void;
};

export default function RewardPointsCard({ totalPoints, level, pointsToNextLevel, progressPercent, totalSavings, expiryDate, onRedeem }: Props) {
  
  const getLevelColor = () => {
    switch (level) {
      case "Silver": return "from-gray-400 to-gray-600 border-gray-400/30 text-gray-200";
      case "Gold": return "from-yellow-400 to-yellow-600 border-yellow-500/30 text-yellow-500";
      case "Platinum": return "from-indigo-400 to-purple-600 border-indigo-500/30 text-indigo-300";
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-[#F8FAFC] rounded-3xl p-6 md:p-8 border border-[#E5E7EB] shadow-2xl relative overflow-hidden mb-12"
    >
      {/* Background Decor */}
      <div className="absolute -top-20 -right-20 w-64 h-64 bg-primary/10 rounded-full blur-[80px] pointer-events-none"></div>

      <div className="flex flex-col md:flex-row md:items-start justify-between gap-8 relative z-10">
        
        {/* Left Side: Points & Level */}
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <Coins className="w-5 h-5 text-yellow-500" />
            <h3 className="text-[#6B7280] font-bold uppercase tracking-widest text-sm">Total Reward Points</h3>
          </div>
          
          <div className="text-5xl md:text-6xl font-black text-white mb-6">
            {totalPoints.toLocaleString()}
          </div>

          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r border shadow-lg mb-6 ${getLevelColor()}`}>
            <Crown className="w-5 h-5" />
            <span className="font-bold text-[#111827] tracking-wide">{level} Member</span>
          </div>
          
          {/* Progress Bar */}
          <div className="mb-2 flex justify-between text-xs font-bold text-[#6B7280]">
            <span>Current: {level}</span>
            <span>{pointsToNextLevel} pts to next level</span>
          </div>
          <div className="h-3 w-full bg-white rounded-full overflow-hidden border border-[#E5E7EB]">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 1.5, ease: "easeOut" }}
              className="h-full bg-gradient-to-r from-primary to-orange-500 rounded-full"
            />
          </div>
        </div>

        {/* Right Side: Savings & CTA */}
        <div className="flex-1 md:flex-none flex flex-col justify-between md:min-w-[250px] gap-6">
          
          <div className="bg-white border border-[#E5E7EB] rounded-2xl p-5">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[#6B7280] text-sm font-bold">Total Savings</span>
              <TrendingUp className="w-4 h-4 text-green-400" />
            </div>
            <div className="text-2xl font-black text-green-400">₹{totalSavings.toLocaleString()}</div>
          </div>

          <div>
            <p className="text-[#9CA3AF] text-xs mb-3 text-center md:text-left">Points expire on {expiryDate}</p>
            <button 
              onClick={onRedeem}
              className="w-full bg-white text-black hover:bg-gray-200 py-4 rounded-xl font-black text-lg transition-colors shadow-xl hover:-translate-y-1"
            >
              Redeem Rewards
            </button>
          </div>
          
        </div>

      </div>
    </motion.div>
  );
}
