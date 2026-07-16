"use client";

import { motion } from "framer-motion";
import { MessageSquareText, PhoneCall, Mail, Handshake } from "lucide-react";

export default function QuickContactCards() {
  const cards = [
    { icon: MessageSquareText, title: "Live Chat", desc: "Instant help for urgent issues.", color: "text-blue-400" },
    { icon: PhoneCall, title: "Call Support", desc: "Speak directly to our team.", color: "text-green-400" },
    { icon: Mail, title: "Email Support", desc: "Get detailed help within 24hrs.", color: "text-purple-400" },
    { icon: Handshake, title: "Business Partnership", desc: "Join our restaurant network.", color: "text-primary" }
  ];

  return (
    <div className="py-20">
      <div className="container mx-auto px-4 md:px-8">
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {cards.map((card, idx) => (
            <motion.div 
              key={idx}
              whileHover={{ y: -8 }}
              className="bg-[#171717] rounded-3xl p-8 border border-white/5 hover:border-white/20 transition-all duration-300 shadow-xl cursor-pointer text-center group relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-t from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
              <div className="w-16 h-16 mx-auto rounded-2xl bg-[#111] border border-white/10 flex items-center justify-center mb-6 group-hover:border-primary/50 transition-colors">
                <card.icon className={`w-8 h-8 ${card.color}`} />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">{card.title}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">{card.desc}</p>
            </motion.div>
          ))}
        </div>

      </div>
    </div>
  );
}
