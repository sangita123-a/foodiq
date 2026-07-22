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
    <div className="bg-white py-4 max-md:py-4 md:py-20">
      <div className="container mx-auto max-w-4xl px-3 max-md:px-3 md:px-8">
        
        <div className="mb-4 text-center max-md:mb-4 md:mb-12">
          <h2 className="mb-1 text-base font-black text-foreground max-md:text-base md:mb-4 md:text-4xl">Frequently Asked Questions</h2>
          <p className="text-[11px] text-gray-text max-md:text-[11px] md:text-base">Find quick answers to common questions below.</p>
        </div>

        <div className="mb-4 space-y-2 max-md:mb-4 max-md:space-y-2 md:mb-10 md:space-y-4">
          {faqs.map((faq) => (
            <div 
              key={faq.id} 
              className="overflow-hidden rounded-lg border border-border bg-white shadow-[0_4px_20px_rgba(0,0,0,0.06)] max-md:rounded-lg md:rounded-2xl"
            >
              <button 
                onClick={() => toggle(faq.id)}
                className="flex w-full items-center justify-between p-3 text-left transition-colors hover:bg-section max-md:p-3 md:p-6"
              >
                <span className={`pr-3 text-xs font-bold transition-colors max-md:text-xs md:pr-4 md:text-base ${openId === faq.id ? "text-primary" : "text-foreground"}`}>
                  {faq.question}
                </span>
                <motion.div 
                  animate={{ rotate: openId === faq.id ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                  className="shrink-0"
                >
                  <ChevronDown className={`h-4 w-4 max-md:h-4 max-md:w-4 md:h-5 md:w-5 ${openId === faq.id ? "text-primary" : "text-gray-text"}`} />
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
                    <div className="border-t border-border px-3 pb-3 pt-1.5 text-[11px] leading-relaxed text-gray-text max-md:px-3 max-md:pb-3 max-md:pt-1.5 max-md:text-[11px] md:px-6 md:pb-6 md:pt-2 md:text-base">
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
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-white px-4 py-2 text-xs font-semibold text-foreground transition-colors hover:bg-section max-md:gap-1.5 max-md:px-4 max-md:py-2 max-md:text-xs md:gap-2 md:rounded-xl md:px-8 md:py-3.5 md:text-base"
          >
            View All FAQs <ArrowRight className="h-4 w-4 text-gray-text max-md:h-4 max-md:w-4 md:h-5 md:w-5" />
          </Link>
        </div>

      </div>
    </div>
  );
}
