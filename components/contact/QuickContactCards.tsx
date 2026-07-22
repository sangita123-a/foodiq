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
    <div className="py-3 max-md:py-3 md:py-20">
      <div className="container mx-auto px-3 max-md:px-3 md:px-8">
        <div className="grid grid-cols-2 gap-1.5 max-md:grid-cols-2 max-md:gap-1.5 sm:grid-cols-2 lg:grid-cols-4 md:gap-6">
          {cards.map((card, idx) => (
            <motion.div
              key={idx}
              whileHover={{ y: -8 }}
              className="group relative cursor-pointer overflow-hidden rounded-lg border border-border bg-white p-2 text-center shadow-card transition-all duration-300 max-md:rounded-lg max-md:p-2 md:rounded-3xl md:p-8 md:hover:border-border"
            >
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#FAFAFA]/80 to-transparent opacity-0 transition-opacity group-hover:opacity-100"></div>
              <div className="mx-auto mb-1 flex h-8 w-8 items-center justify-center rounded-md border border-border bg-section transition-colors group-hover:border-border max-md:mb-1 max-md:h-8 max-md:w-8 md:mb-6 md:h-16 md:w-16 md:rounded-2xl">
                <card.icon className={`h-4 w-4 ${card.color} max-md:h-4 max-md:w-4 md:h-8 md:w-8`} />
              </div>
              <h3 className="mb-0 text-[10px] font-bold text-foreground max-md:text-[10px] md:mb-2 md:text-xl">{card.title}</h3>
              <p className="line-clamp-1 text-[9px] leading-snug text-gray-text max-md:text-[9px] md:line-clamp-2 md:text-sm md:leading-relaxed">{card.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
