"use client";

import { motion } from "framer-motion";
import { Utensils, Star, Users, PartyPopper } from "lucide-react";

export default function EarnPointsGuide() {
  const guideItems = [
    {
      icon: Utensils,
      title: "Place Orders",
      desc: "Earn 10 points for every ₹100 spent on any food order.",
      color: "text-primary",
      bg: "bg-primary/10"
    },
    {
      icon: Star,
      title: "Write Reviews",
      desc: "Get 50 bonus points for rating and reviewing restaurants.",
      color: "text-yellow-500",
      bg: "bg-yellow-500/10"
    },
    {
      icon: Users,
      title: "Refer Friends",
      desc: "Earn 500 points when a friend makes their first order.",
      color: "text-blue-500",
      bg: "bg-blue-500/10"
    },
    {
      icon: PartyPopper,
      title: "Festival Bonuses",
      desc: "Look out for 2X points during major festivals and holidays.",
      color: "text-purple-500",
      bg: "bg-purple-500/10"
    }
  ];

  return (
    <div className="mb-16">
      <h2 className="text-2xl font-bold text-white mb-8">How to Earn Points</h2>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {guideItems.map((item, idx) => (
          <motion.div 
            key={idx}
            whileHover={{ y: -5 }}
            className="bg-section rounded-3xl p-6 border border-border hover:border-border transition-colors shadow-lg"
          >
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-6 ${item.bg}`}>
              <item.icon className={`w-6 h-6 ${item.color}`} />
            </div>
            <h4 className="text-lg font-bold text-white mb-2">{item.title}</h4>
            <p className="text-sm text-gray-text leading-relaxed">{item.desc}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
