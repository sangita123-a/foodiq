"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { PackageSearch, CreditCard, AlertTriangle, MessageSquare, PhoneCall, Mail } from "lucide-react";

export type QuickHelpAction =
  | "track"
  | "payments"
  | "order-problem"
  | "live-chat"
  | "call"
  | "email";

type Props = {
  onAction?: (action: QuickHelpAction) => void;
};

const ACTION_HREF: Partial<Record<QuickHelpAction, string>> = {
  track: "/track-order",
  payments: "/payment-support",
  "order-problem": "/report-problem",
  email: "/email-support",
};

const CARD_CLASS =
  "bg-section rounded-3xl p-6 border border-border hover:border-border transition-all duration-300 shadow-lg cursor-pointer group text-left block h-full";

export default function QuickHelpCards({ onAction }: Props) {
  const cards: Array<{
    icon: typeof PackageSearch;
    title: string;
    desc: string;
    color: string;
    bg: string;
    action: QuickHelpAction;
  }> = [
    { icon: PackageSearch, title: "Track an Order", desc: "Check real-time status of your food delivery.", color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/20", action: "track" },
    { icon: CreditCard, title: "Payment Issues", desc: "Refunds, failed transactions, and payment methods.", color: "text-green-400", bg: "bg-green-500/10 border-green-500/20", action: "payments" },
    { icon: AlertTriangle, title: "Order Problems", desc: "Missing items, wrong orders, or poor quality.", color: "text-yellow-400", bg: "bg-yellow-500/10 border-yellow-500/20", action: "order-problem" },
    { icon: MessageSquare, title: "Live Chat", desc: "Chat instantly with our support team.", color: "text-primary", bg: "bg-primary/10 border-primary/20", action: "live-chat" },
    { icon: PhoneCall, title: "Call Support", desc: "Speak directly to a customer care executive.", color: "text-purple-400", bg: "bg-purple-500/10 border-purple-500/20", action: "call" },
    { icon: Mail, title: "Email Support", desc: "Write to us for detailed queries or feedback.", color: "text-primary", bg: "bg-primary/10 border-primary/20", action: "email" },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
      {cards.map((card, idx) => {
        const href = ACTION_HREF[card.action];
        const body = (
          <>
            <div
              className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 border transition-colors ${card.bg} group-hover:bg-section group-hover:border-border`}
            >
              <card.icon className={`w-7 h-7 ${card.color}`} />
            </div>
            <h3 className="text-xl font-bold text-foreground mb-2 group-hover:text-primary transition-colors">
              {card.title}
            </h3>
            <p className="text-gray-text text-sm leading-relaxed">{card.desc}</p>
          </>
        );

        if (href) {
          return (
            <motion.div key={idx} whileHover={{ y: -8 }} className="h-full">
              <Link
                href={href}
                className={CARD_CLASS}
                onClick={(e) => {
                  if (!onAction) return;
                  e.preventDefault();
                  onAction(card.action);
                }}
              >
                {body}
              </Link>
            </motion.div>
          );
        }

        return (
          <motion.button
            type="button"
            key={idx}
            whileHover={{ y: -8 }}
            onClick={() => onAction?.(card.action)}
            className={CARD_CLASS}
            aria-label={card.title}
          >
            {body}
          </motion.button>
        );
      })}
    </div>
  );
}
