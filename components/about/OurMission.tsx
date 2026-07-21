"use client";

import { motion } from "framer-motion";
import { Rocket, Utensils, Heart } from "lucide-react";

export default function OurMission() {
  const missions = [
    {
      icon: Rocket,
      title: "Fast Delivery",
      desc: "Our optimized logistics ensure your food reaches you piping hot, right when you want it.",
      color: "text-blue-400",
      bg: "bg-blue-500/10 border-blue-500/20"
    },
    {
      icon: Utensils,
      title: "Quality Food",
      desc: "We partner exclusively with top-rated restaurants that maintain the highest hygiene standards.",
      color: "text-green-400",
      bg: "bg-green-500/10 border-green-500/20"
    },
    {
      icon: Heart,
      title: "Customer First",
      desc: "Your satisfaction is our priority. Our 24/7 support team is always here for you.",
      color: "text-primary",
      bg: "bg-primary/10 border-primary/20"
    }
  ];

  return (
    <div className="py-24 bg-white">
      <div className="container mx-auto px-4 md:px-8">
        
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-black text-white mb-6">Our Mission</h2>
          <div className="w-20 h-1.5 bg-primary rounded-full mx-auto"></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {missions.map((mission, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.6, delay: idx * 0.2 }}
              whileHover={{ y: -10 }}
              className="bg-section rounded-3xl p-8 border border-border hover:border-border transition-all duration-300 shadow-xl group text-center"
            >
              <div className={`w-20 h-20 mx-auto rounded-2xl flex items-center justify-center mb-8 border transition-colors ${mission.bg} group-hover:bg-section group-hover:border-border`}>
                <mission.icon className={`w-10 h-10 ${mission.color}`} />
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">{mission.title}</h3>
              <p className="text-gray-text leading-relaxed">{mission.desc}</p>
            </motion.div>
          ))}
        </div>

      </div>
    </div>
  );
}
