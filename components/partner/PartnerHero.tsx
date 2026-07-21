"use client";

import { motion } from "framer-motion";
import { Utensils, Activity, DollarSign, Star } from "lucide-react";

export default function PartnerHero() {
  const features = [
    { icon: Utensils, title: "Manage Menu", desc: "Easily add, edit, or disable items in real-time.", color: "text-blue-400" },
    { icon: Activity, title: "Live Orders", desc: "Track and manage incoming orders instantly.", color: "text-green-400" },
    { icon: DollarSign, title: "Earnings Dashboard", desc: "Monitor your revenue and daily payouts.", color: "text-yellow-400" },
    { icon: Star, title: "Customer Reviews", desc: "Engage with customers and build loyalty.", color: "text-purple-400" }
  ];

  return (
    <div className="relative w-full h-full min-h-[50vh] lg:min-h-screen flex flex-col justify-center p-8 lg:p-16 overflow-hidden">
      
      {/* Background Image with Dark Overlay */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center"
        style={{ backgroundImage: "url('/images/catalog/restaurants/fast-food.webp')" }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-[#FFFFFF]/95 via-[#FFFFFF]/80 to-transparent"></div>
      </div>

      <div className="relative z-10 w-full max-w-xl">
        <motion.h1 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-4xl md:text-5xl lg:text-6xl font-black text-foreground mb-6 leading-tight"
        >
          Grow Your Restaurant with <span className="text-primary">Foodiq</span>
        </motion.h1>
        
        <motion.p 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="text-gray-text text-lg mb-12 leading-relaxed"
        >
          Manage orders, update menus, track earnings, and reach thousands of customers all from one simple, powerful dashboard.
        </motion.p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {features.map((feature, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 + (idx * 0.1) }}
              className="bg-background/70 backdrop-blur-md border border-border rounded-2xl p-6 hover:bg-section transition-colors"
            >
              <div className="w-12 h-12 bg-section rounded-xl flex items-center justify-center mb-4 border border-border">
                <feature.icon className={`w-6 h-6 ${feature.color}`} />
              </div>
              <h3 className="text-foreground font-bold mb-2">{feature.title}</h3>
              <p className="text-gray-text text-sm leading-relaxed">{feature.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
      
    </div>
  );
}
