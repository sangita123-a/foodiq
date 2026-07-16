"use client";

import { motion } from "framer-motion";
import { ShieldCheck, Award, Lightbulb, Smile } from "lucide-react";

export default function OurValues() {
  const values = [
    { icon: ShieldCheck, title: "Trust", desc: "Building reliable relationships with every delivery.", color: "text-blue-400" },
    { icon: Award, title: "Quality", desc: "Never compromising on the standard of our service.", color: "text-green-400" },
    { icon: Lightbulb, title: "Innovation", desc: "Constantly evolving to improve your experience.", color: "text-yellow-400" },
    { icon: Smile, title: "Satisfaction", desc: "Dedicated to bringing joy to your dining table.", color: "text-purple-400" }
  ];

  return (
    <div className="py-24">
      <div className="container mx-auto px-4 md:px-8">
        
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-black text-white mb-6">Our Core Values</h2>
          <div className="w-20 h-1.5 bg-primary rounded-full mx-auto"></div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {values.map((value, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.6, delay: idx * 0.15 }}
              whileHover={{ y: -10 }}
              className="bg-[#111] rounded-3xl p-8 border border-white/5 hover:border-primary/40 transition-all duration-300 shadow-xl group text-center relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-t from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              
              <div className="relative z-10">
                <div className="w-16 h-16 mx-auto rounded-full bg-[#171717] border border-white/10 flex items-center justify-center mb-6 group-hover:border-primary/50 transition-colors">
                  <value.icon className={`w-8 h-8 ${value.color}`} />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">{value.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{value.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>

      </div>
    </div>
  );
}
