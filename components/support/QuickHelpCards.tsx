"use client";

import { motion } from "framer-motion";
import { PackageSearch, CreditCard, AlertTriangle, MessageSquare, PhoneCall, Mail } from "lucide-react";

export default function QuickHelpCards() {
  const cards = [
    { icon: PackageSearch, title: "Track an Order", desc: "Check real-time status of your food delivery.", color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/20" },
    { icon: CreditCard, title: "Payment Issues", desc: "Refunds, failed transactions, and payment methods.", color: "text-green-400", bg: "bg-green-500/10 border-green-500/20" },
    { icon: AlertTriangle, title: "Order Problems", desc: "Missing items, wrong orders, or poor quality.", color: "text-yellow-400", bg: "bg-yellow-500/10 border-yellow-500/20" },
    { icon: MessageSquare, title: "Live Chat", desc: "Chat instantly with our support team.", color: "text-primary", bg: "bg-primary/10 border-primary/20" },
    { icon: PhoneCall, title: "Call Support", desc: "Speak directly to a customer care executive.", color: "text-purple-400", bg: "bg-purple-500/10 border-purple-500/20" },
    { icon: Mail, title: "Email Support", desc: "Write to us for detailed queries or feedback.", color: "text-[#E23744]", bg: "bg-[#E23744]/10 border-[#E23744]/20" },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
      {cards.map((card, idx) => (
        <motion.div 
          key={idx}
          whileHover={{ y: -8 }}
          className="bg-[#F8FAFC] rounded-3xl p-6 border border-[#E5E7EB] hover:border-[#E5E7EB] transition-all duration-300 shadow-lg cursor-pointer group"
        >
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 border transition-colors ${card.bg} group-hover:bg-[#F8FAFC] group-hover:border-[#E5E7EB]`}>
            <card.icon className={`w-7 h-7 ${card.color}`} />
          </div>
          <h3 className="text-xl font-bold text-white mb-2 group-hover:text-primary transition-colors">{card.title}</h3>
          <p className="text-[#6B7280] text-sm leading-relaxed">{card.desc}</p>
        </motion.div>
      ))}
    </div>
  );
}
