"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, MessageCircle, Minus, Plus, Search } from "lucide-react";

type FAQItem = {
  id: string;
  question: string;
  answer: string;
};

const faqData: FAQItem[] = [
  {
    id: "faq1",
    question: "How do I place an order?",
    answer:
      "Browse restaurants, add your preferred dishes to the cart, enter your delivery details, and complete payment at checkout.",
  },
  {
    id: "faq2",
    question: "How can I track my order?",
    answer:
      "Open My Orders and select your active order to view live preparation and delivery updates.",
  },
  {
    id: "faq3",
    question: "Which payment methods are supported?",
    answer:
      "We support UPI, credit and debit cards, net banking, wallets, and Cash on Delivery where available.",
  },
  {
    id: "faq4",
    question: "How do I apply coupons?",
    answer:
      "Enter a valid coupon code in the cart or at checkout and select Apply to update your order total.",
  },
  {
    id: "faq5",
    question: "Can I cancel my order?",
    answer:
      "You can cancel before the restaurant starts preparing your order from the active order details page.",
  },
  {
    id: "faq6",
    question: "How do I update my profile?",
    answer:
      "Open Profile, select Edit Profile, update your details, and save the changes.",
  },
  {
    id: "faq7",
    question: "How do I contact customer support?",
    answer:
      "Visit Help & Support or email support@foodiq.com for assistance with your order or account.",
  },
];

export default function FAQ() {
  const [openId, setOpenId] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  const toggleAccordion = (id: string) => {
    setOpenId((currentId) => (currentId === id ? null : id));
  };

  const filteredFaqs = useMemo(() => {
    const searchTerm = query.trim().toLowerCase();
    if (!searchTerm) return faqData;
    return faqData.filter(
      ({ question, answer }) =>
        question.toLowerCase().includes(searchTerm) ||
        answer.toLowerCase().includes(searchTerm),
    );
  }, [query]);

  return (
    <section className="w-full border-t border-[#EAEAEA] bg-[#FAFAFA] py-16 md:py-24">
      <div className="mx-auto w-[calc(100%-32px)] max-w-5xl md:w-[calc(100%-64px)]">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="mb-8 text-center"
        >
          <span className="mb-3 inline-flex rounded-full border border-[#ECECEC] bg-[#FAFAFA] px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-[#696969]">
            Help Center
          </span>
          <h2 className="mb-3 text-3xl font-bold tracking-[-0.045em] text-[#1C1C1C] md:text-5xl">
            Frequently Asked Questions
          </h2>
          <p className="mx-auto max-w-2xl text-sm leading-6 text-[#686B78] md:text-base">
            Everything you need to know before placing your order.
          </p>
        </motion.div>

        <div className="relative mx-auto mb-8 max-w-2xl">
          <Search
            className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#9CA3AF]"
            aria-hidden="true"
          />
          <input
            type="search"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setOpenId(null);
            }}
            placeholder="Search questions, payments, refunds..."
            aria-label="Search frequently asked questions"
            className="h-13 w-full rounded-[14px] border border-[#EAEAEA] bg-white py-3 pl-12 pr-4 text-sm text-[#1C1C1C] shadow-[0_4px_20px_rgba(0,0,0,0.08)] outline-none transition-all duration-300 placeholder:text-[#9C9C9C] focus:border-[#D4D4D4] focus:ring-4 focus:ring-[rgba(0,0,0,0.04)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#E23744]"
          />
        </div>

        <div className="space-y-3">
          {filteredFaqs.map((faq, index) => {
            const isOpen = openId === faq.id;
            const answerId = `${faq.id}-answer`;

            return (
              <motion.article
                key={faq.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.35, delay: Math.min(index * 0.025, 0.25) }}
                className={`overflow-hidden rounded-2xl border bg-white transition-all duration-300 ${
                  isOpen
                    ? "border-[#EAEAEA] shadow-[0_8px_28px_rgba(0,0,0,0.08)]"
                    : "border-[#EAEAEA] shadow-[0_4px_20px_rgba(0,0,0,0.06)] hover:-translate-y-0.5 hover:border-[#D4D4D4] hover:shadow-[0_8px_28px_rgba(0,0,0,0.08)]"
                }`}
              >
                <button
                  type="button"
                  onClick={() => toggleAccordion(faq.id)}
                  aria-expanded={isOpen}
                  aria-controls={answerId}
                  className="flex w-full items-center justify-between gap-4 p-4 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#E23744] sm:p-5"
                >
                  <span
                    className={`text-sm font-semibold leading-6 transition-colors duration-300 sm:text-base ${
                      isOpen ? "text-[#1C1C1C]" : "text-[#1C1C1C]"
                    }`}
                  >
                    {faq.question}
                  </span>
                  <motion.span
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border transition-colors duration-300 ${
                      isOpen
                        ? "border-[#ECECEC] bg-[#FAFAFA] text-[#1C1C1C]"
                        : "border-[#ECECEC] bg-[#FAFAFA] text-[#696969]"
                    }`}
                    aria-hidden="true"
                  >
                    <AnimatePresence mode="wait" initial={false}>
                      <motion.span
                        key={isOpen ? "minus" : "plus"}
                        initial={{ opacity: 0, scale: 0.5, rotate: -90 }}
                        animate={{ opacity: 1, scale: 1, rotate: 0 }}
                        exit={{ opacity: 0, scale: 0.5, rotate: 90 }}
                        transition={{ duration: 0.15 }}
                      >
                        {isOpen ? (
                          <Minus className="h-4 w-4" />
                        ) : (
                          <Plus className="h-4 w-4" />
                        )}
                      </motion.span>
                    </AnimatePresence>
                  </motion.span>
                </button>

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      id={answerId}
                      role="region"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                    >
                      <div className="mx-4 border-t border-[#E5E7EB] pb-5 pt-4 text-sm leading-6 text-[#6B7280] sm:mx-5">
                        {faq.answer}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.article>
            );
          })}
        </div>

        {filteredFaqs.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-dashed border-[#E5E7EB] bg-[#F8FAFC] px-6 py-14 text-center"
          >
            <Search className="mx-auto mb-3 h-8 w-8 text-[#9CA3AF]" />
            <p className="font-medium text-[#6B7280]">No matching questions found.</p>
          </motion.div>
        )}

        <div className="mt-10 rounded-[20px] border border-[#EAEAEA] bg-[#FAFAFA] p-6 text-center shadow-[0_4px_20px_rgba(0,0,0,0.08)] sm:p-8">
          <h3 className="text-xl font-bold text-[#1C1C1C]">Still need help?</h3>
          <p className="mt-1 text-sm text-[#686B78]">
            Our support team is ready to help.
          </p>
          <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
            <a
              href="/help-support"
              className="food-button food-button-primary inline-flex min-h-11 items-center justify-center gap-2 px-5 py-2.5 text-sm"
            >
              <MessageCircle className="h-4 w-4" />
              Contact Support
            </a>
            <a
              href="mailto:support@foodiq.com"
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[#EAEAEA] bg-white px-5 text-sm font-bold text-[#1C1C1C] transition-all duration-300 hover:-translate-y-0.5 hover:border-[#D4D4D4] hover:bg-[#FAFAFA]"
            >
              <Mail className="h-4 w-4" />
              Email Us
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
