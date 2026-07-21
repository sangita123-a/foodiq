"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";

export type FaqType = {
  id: string;
  question: string;
  answer: string;
};

type Props = {
  faqs: FaqType[];
};

export default function FaqAccordion({ faqs }: Props) {
  const [openId, setOpenId] = useState<string | null>(null);

  const toggle = (id: string) => {
    setOpenId(openId === id ? null : id);
  };

  return (
    <div className="bg-[#F8FAFC] rounded-3xl p-6 md:p-8 border border-[#E5E7EB]">
      <h2 className="text-2xl font-bold text-[#1C1C1C] mb-8">Frequently Asked Questions</h2>
      
      <div className="space-y-4">
        {faqs.map((faq) => (
          <div 
            key={faq.id} 
            className="border border-[#E5E7EB] rounded-2xl overflow-hidden bg-white"
          >
            <button 
              onClick={() => toggle(faq.id)}
              className="w-full flex items-center justify-between p-5 md:p-6 text-left transition-colors hover:bg-[#F8FAFC]"
            >
              <span className={`font-bold pr-4 transition-colors ${openId === faq.id ? "text-[#E23744]" : "text-[#1C1C1C]"}`}>
                {faq.question}
              </span>
              <motion.div 
                animate={{ rotate: openId === faq.id ? 180 : 0 }}
                transition={{ duration: 0.2 }}
                className="flex-shrink-0"
              >
                <ChevronDown className={`w-5 h-5 ${openId === faq.id ? "text-primary" : "text-[#6B7280]"}`} />
              </motion.div>
            </button>
            
            <AnimatePresence>
              {openId === faq.id && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                >
                  <div className="px-5 md:px-6 pb-6 pt-2 text-[#6B7280] leading-relaxed border-t border-[#E5E7EB]">
                    {faq.answer}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>
    </div>
  );
}
