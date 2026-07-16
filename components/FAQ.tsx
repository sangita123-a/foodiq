"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Minus } from "lucide-react";

type FAQItem = {
  id: string;
  question: string;
  answer: string;
};

const faqData: FAQItem[] = [
  {
    id: "faq1",
    question: "How do I place an order?",
    answer: "Simply browse through our restaurant partners or search for your favorite dish. Add items to your cart, proceed to checkout, enter your delivery address, and choose your preferred payment method."
  },
  {
    id: "faq2",
    question: "How can I track my delivery?",
    answer: "Once your order is confirmed, you can track its status in real-time on the 'My Orders' page. You will also receive live updates and the delivery partner's contact details when the order is picked up."
  },
  {
    id: "faq3",
    question: "Which payment methods are accepted?",
    answer: "We accept all major credit and debit cards, UPI, net banking, and popular mobile wallets. Cash on Delivery (COD) is also available for selected locations and restaurants."
  },
  {
    id: "faq4",
    question: "Can I cancel or modify my order?",
    answer: "Orders can only be cancelled or modified within 60 seconds of placing them. Once the restaurant accepts and starts preparing your food, cancellations are no longer possible."
  },
  {
    id: "faq5",
    question: "Is contactless delivery available?",
    answer: "Yes! You can select the 'Contactless Delivery' option at checkout. Our delivery partner will securely place your order at your doorstep and notify you once it's delivered."
  },
  {
    id: "faq6",
    question: "How do I apply coupon codes?",
    answer: "During checkout, you will see an 'Apply Promo Code' section. Enter your valid coupon code there and click 'Apply' to see the updated discounted total before making the payment."
  }
];

export default function FAQ() {
  const [openId, setOpenId] = useState<string | null>(null);

  const toggleAccordion = (id: string) => {
    setOpenId(openId === id ? null : id);
  };

  return (
    <section className="bg-black w-full py-[100px] border-t border-white/5">
      <div className="w-[90%] max-w-7xl mx-auto">
        
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="mb-14 text-center md:text-left"
        >
          <h2 className="text-3xl md:text-5xl font-bold text-white tracking-tight mb-3">
            Frequently Asked Questions
          </h2>
          <p className="text-gray-400 text-lg md:text-xl font-light">
            Everything you need to know before placing your order.
          </p>
        </motion.div>

        {/* FAQ Grid (Two columns on Desktop) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-8 gap-y-4">
          {faqData.map((faq, index) => {
            const isOpen = openId === faq.id;

            return (
              <motion.div 
                key={faq.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className={`bg-[#171717] border border-white/5 rounded-2xl overflow-hidden transition-all duration-300 hover:border-white/10 ${
                  isOpen ? 'shadow-[0_10px_30px_rgba(255,45,59,0.1)]' : 'shadow-sm'
                }`}
              >
                <button
                  onClick={() => toggleAccordion(faq.id)}
                  className="w-full flex items-center justify-between p-6 text-left focus:outline-none"
                >
                  <span className={`font-semibold text-lg transition-colors duration-300 ${isOpen ? 'text-[#FF2D3B]' : 'text-white'}`}>
                    {faq.question}
                  </span>
                  <div className={`flex-shrink-0 ml-4 w-8 h-8 rounded-full flex items-center justify-center transition-colors duration-300 ${
                    isOpen ? 'bg-[#FF2D3B] text-white' : 'bg-white/5 text-gray-400'
                  }`}>
                    {isOpen ? <Minus className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                  </div>
                </button>
                
                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                    >
                      <div className="px-6 pb-6 text-gray-400 leading-relaxed">
                        {faq.answer}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
