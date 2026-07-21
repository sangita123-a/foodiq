"use client";

import { motion } from "framer-motion";

type PartnerWelcomeProps = {
  restaurantName?: string;
};

export default function PartnerWelcome({ restaurantName = "Partner" }: PartnerWelcomeProps) {
  const currentDate = new Date().toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="mb-8"
    >
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-black text-foreground mb-2">
            Welcome Back, {restaurantName}! 👋
          </h1>
          <p className="text-gray-text">Here&apos;s what&apos;s happening with your restaurant today.</p>
        </div>
        <div className="bg-background px-5 py-2.5 rounded-xl border border-border inline-flex self-start md:self-auto">
          <span className="text-sm font-bold text-gray-text">{currentDate}</span>
        </div>
      </div>
    </motion.div>
  );
}
