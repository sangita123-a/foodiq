"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function FaqPreview() {
  const faqs = [
    { id: "q1", question: "How long does delivery usually take?", answer: "Our average delivery time is 30-45 minutes depending on the restaurant's preparation time and your distance." },
    { id: "q2", question: "What payment methods do you accept?", answer: "We accept all major Credit/Debit cards, UPI, popular digital wallets, and Cash on Delivery for select orders." },
    { id: "q3", question: "How can I become a restaurant partner?", answer: "Please use the contact form above and select 'Business' as the reason. Our partnership team will contact you within 24 hours." },
    { id: "q4", question: "Do you offer refunds for poor quality food?", answer: "Absolutely. If your order arrives in poor condition, please take a photo and submit a support ticket immediately. We will initiate a full refund." }
  ];

  const [openId, setOpenId] = useState<string | null>(faqs[0].id);

  const toggle = (id: string) => {
    setOpenId(openId === id ? null : id);
  };

  return (
    <div className="py-20 bg-white">
      <div className="container mx-auto px-4 md:px-8 max-w-4xl">
        
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-black text-[#1C1C1C] mb-4">Frequently Asked Questions</h2>
          <p className="text-[#696969]">Find quick answers to common questions below.</p>
        </div>

        <div className="space-y-4 mb-10">
          {faqs.map((faq) => (
            <div 
              key={faq.id} 
              className="border border-[#E8E8E8] rounded-2xl overflow-hidden bg-white shadow-[0_4px_20px_rgba(0,0,0,0.06)]"
            >
              <button 
                onClick={() => toggle(faq.id)}
                className="w-full flex items-center justify-between p-5 md:p-6 text-left transition-colors hover:bg-[#FAFAFA]"
              >
                <span className={`font-bold pr-4 transition-colors ${openId === faq.id ? "text-[#E23744]" : "text-[#1C1C1C]"}`}>
                  {faq.question}
                </span>
                <motion.div 
                  animate={{ rotate: openId === faq.id ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                  className="flex-shrink-0"
                >
                  <ChevronDown className={`w-5 h-5 ${openId === faq.id ? "text-[#E23744]" : "text-[#696969]"}`} />
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
                    <div className="px-5 md:px-6 pb-6 pt-2 text-[#696969] leading-relaxed border-t border-[#E8E8E8]">
                      {faq.answer}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>

        <div className="text-center">
          <Link 
            href="/help-support"
            className="inline-flex items-center gap-2 bg-white hover:bg-[#FAFAFA] text-[#1C1C1C] border border-[#E8E8E8] px-8 py-3.5 rounded-xl font-semibold transition-colors"
          >
            View All FAQs <ArrowRight className="w-5 h-5 text-[#696969]" />
          </Link>
        </div>

      </div>
    </div>
  );
}
