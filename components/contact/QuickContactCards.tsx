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
    <div className="py-6 max-md:py-6 md:py-20">
      <div className="container mx-auto px-3 max-md:px-3 md:px-8">
        <div className="grid grid-cols-2 gap-2 max-md:grid-cols-2 max-md:gap-2 sm:grid-cols-2 lg:grid-cols-4 md:gap-6">
          {cards.map((card, idx) => (
            <motion.div
              key={idx}
              whileHover={{ y: -8 }}
              className="group relative cursor-pointer overflow-hidden rounded-xl border border-border bg-white p-3 text-center shadow-card transition-all duration-300 max-md:rounded-xl max-md:p-3 md:rounded-3xl md:p-8 md:hover:border-border"
            >
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#FAFAFA]/80 to-transparent opacity-0 transition-opacity group-hover:opacity-100"></div>
              <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-section transition-colors group-hover:border-border max-md:mb-2 max-md:h-10 max-md:w-10 md:mb-6 md:h-16 md:w-16 md:rounded-2xl">
                <card.icon className={`h-5 w-5 ${card.color} max-md:h-5 max-md:w-5 md:h-8 md:w-8`} />
              </div>
              <h3 className="mb-0.5 text-xs font-bold text-foreground max-md:text-xs md:mb-2 md:text-xl">{card.title}</h3>
              <p className="line-clamp-2 text-[10px] leading-snug text-gray-text max-md:text-[10px] md:text-sm md:leading-relaxed">{card.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
