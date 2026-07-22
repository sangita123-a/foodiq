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
    <section className="w-full border-t border-border bg-section py-6 max-md:py-5 md:py-24">
      <div className="mx-auto w-[calc(100%-24px)] max-w-5xl md:w-[calc(100%-64px)]">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="mb-4 text-center max-md:mb-3 md:mb-8"
        >
          <span className="mb-2 inline-flex rounded-full border border-border bg-section px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.16em] text-gray-text max-md:mb-2 md:mb-3 md:px-3 md:py-1 md:text-xs">
            Help Center
          </span>
          <h2 className="mb-2 text-lg font-bold tracking-[-0.045em] text-foreground max-md:mb-1 max-md:text-lg md:mb-3 md:text-5xl">
            Frequently Asked Questions
          </h2>
          <p className="mx-auto max-w-2xl text-[11px] leading-5 text-muted max-md:line-clamp-2 md:text-base md:leading-6">
            Everything you need to know before placing your order.
          </p>
        </motion.div>

        <div className="relative mx-auto mb-4 max-w-2xl max-md:mb-3 md:mb-8">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9CA3AF] md:left-4 md:h-5 md:w-5"
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
            className="h-10 w-full rounded-lg border border-border bg-white py-2 pl-9 pr-3 text-xs text-foreground shadow-card outline-none transition-all duration-300 placeholder:text-muted focus:border-border-hover focus:ring-4 focus:ring-[rgba(0,0,0,0.04)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary md:h-13 md:rounded-[14px] md:py-3 md:pl-12 md:pr-4 md:text-sm"
          />
        </div>

        <div className="w-full space-y-2 max-md:space-y-2 md:space-y-3">
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
                className={`overflow-hidden rounded-lg border bg-white transition-all duration-300 max-md:rounded-lg md:rounded-2xl ${
                  isOpen
                    ? "border-border shadow-[0_8px_28px_rgba(0,0,0,0.08)]"
                    : "border-border shadow-[0_4px_20px_rgba(0,0,0,0.06)] md:hover:-translate-y-0.5 md:hover:border-border md:hover:shadow-[0_8px_28px_rgba(0,0,0,0.08)]"
                }`}
              >
                <button
                  type="button"
                  onClick={() => toggleAccordion(faq.id)}
                  aria-expanded={isOpen}
                  aria-controls={answerId}
                  className="flex w-full items-center justify-between gap-2 p-3 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary max-md:p-3 sm:p-5"
                >
                  <span
                    className={`text-xs font-semibold leading-5 transition-colors duration-300 sm:text-base sm:leading-6 ${
                      isOpen ? "text-foreground" : "text-foreground"
                    }`}
                  >
                    {faq.question}
                  </span>
                  <motion.span
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border transition-colors duration-300 max-md:h-7 max-md:w-7 md:h-9 md:w-9 ${
                      isOpen
                        ? "border-border bg-section text-foreground"
                        : "border-border bg-section text-gray-text"
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
                      <div className="mx-3 border-t border-border pb-3 pt-2.5 text-[11px] leading-5 text-gray-text max-md:mx-3 max-md:pb-3 max-md:pt-2 sm:mx-5 sm:pb-5 sm:pt-4 sm:text-sm sm:leading-6">
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
            className="rounded-2xl border border-dashed border-border bg-section px-6 py-14 text-center"
          >
            <Search className="mx-auto mb-3 h-8 w-8 text-[#9CA3AF]" />
            <p className="font-medium text-gray-text">No matching questions found.</p>
          </motion.div>
        )}

        <div className="mt-6 rounded-xl border border-border bg-section p-4 text-center shadow-card max-md:mt-5 max-md:p-4 sm:p-8 md:mt-10 md:rounded-[20px]">
          <h3 className="text-base font-bold text-foreground max-md:text-sm md:text-xl">Still need help?</h3>
          <p className="mt-0.5 text-[11px] text-muted max-md:text-[11px] md:mt-1 md:text-sm">
            Our support team is ready to help.
          </p>
          <div className="mt-4 flex flex-col justify-center gap-2 max-md:mt-3 max-md:gap-2 sm:flex-row sm:gap-3 md:mt-6">
            <a
              href="/help-support"
              className="food-button food-button-primary inline-flex min-h-9 items-center justify-center gap-1.5 px-4 py-2 text-xs max-md:min-h-9 md:min-h-11 md:gap-2 md:px-5 md:py-2.5 md:text-sm"
            >
              <MessageCircle className="h-3.5 w-3.5 md:h-4 md:w-4" />
              Contact Support
            </a>
            <a
              href="mailto:support@foodiq.com"
              className="inline-flex min-h-9 items-center justify-center gap-1.5 rounded-lg border border-border bg-white px-4 text-xs font-bold text-foreground transition-all duration-300 max-md:min-h-9 md:min-h-11 md:rounded-xl md:px-5 md:text-sm md:hover:-translate-y-0.5 md:hover:border-border md:hover:bg-section"
            >
              <Mail className="h-3.5 w-3.5 md:h-4 md:w-4" />
              Email Us
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
