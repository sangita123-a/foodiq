"use client";

import { motion } from "framer-motion";
import { Bike, MapPin, Wallet, Star } from "lucide-react";

export default function DeliveryHero() {
  const features = [
    { icon: Bike, title: "Go Online Fast", desc: "Toggle availability and start receiving nearby delivery requests.", color: "text-blue-400" },
    { icon: MapPin, title: "Smart Routes", desc: "See restaurant and customer locations with distance and ETA.", color: "text-green-400" },
    { icon: Wallet, title: "Track Earnings", desc: "Daily, weekly, and monthly payouts with incentives.", color: "text-yellow-400" },
    { icon: Star, title: "Build Rating", desc: "Complete deliveries on time and grow your partner score.", color: "text-purple-400" },
  ];

  return (
    <div className="relative w-full h-full min-h-[50vh] lg:min-h-screen flex flex-col justify-center p-8 lg:p-16 overflow-hidden">
      <div
        className="absolute inset-0 z-0 bg-cover bg-center"
        style={{ backgroundImage: "url('/images/catalog/restaurants/fast-food.webp')" }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-[#FFFFFF]/95 via-[#FFFFFF]/80 to-transparent" />
      </div>

      <div className="relative z-10 w-full max-w-xl">
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-4xl md:text-5xl lg:text-6xl font-black text-[#111827] mb-6 leading-tight"
        >
          Deliver with <span className="text-[#E23744]">Foodiq</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="text-[#6B7280] text-lg mb-12 leading-relaxed"
        >
          Accept nearby orders, navigate pickups and drop-offs, and track your earnings from one simple delivery dashboard.
        </motion.p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {features.map((feature, idx) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 + idx * 0.1 }}
              className="bg-[#FFFFFF]/70 backdrop-blur-md border border-[#E5E7EB] rounded-2xl p-6 hover:bg-[#F8FAFC] transition-colors"
            >
              <div className="w-12 h-12 bg-[#F8FAFC] rounded-xl flex items-center justify-center mb-4 border border-[#E5E7EB]">
                <feature.icon className={`w-6 h-6 ${feature.color}`} />
              </div>
              <h3 className="text-[#111827] font-bold mb-2">{feature.title}</h3>
              <p className="text-[#6B7280] text-sm leading-relaxed">{feature.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
