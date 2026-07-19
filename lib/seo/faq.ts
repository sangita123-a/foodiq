/** Shared FAQ copy for help page UI and FAQPage JSON-LD. */
export type FaqEntry = {
  id: string;
  question: string;
  answer: string;
};

export const HELP_SUPPORT_FAQS: FaqEntry[] = [
  {
    id: "f1",
    question: "How do I track my order?",
    answer:
      "Once your order is confirmed, you can track it in real-time by going to the 'Live Order Tracking' page or clicking on the active order banner on your homepage. You will see the delivery partner's live location on the map.",
  },
  {
    id: "f2",
    question: "How can I cancel an order?",
    answer:
      "You can cancel an order within 60 seconds of placing it directly from the 'My Orders' page without any penalty. If the restaurant has already started preparing your food, cancellation may incur a small fee.",
  },
  {
    id: "f3",
    question: "How do refunds work?",
    answer:
      "If your order is cancelled, the refund is initiated immediately. For UPI and Wallets, it reflects within 2-4 hours. For Credit/Debit cards, it may take 5-7 business days depending on your bank.",
  },
  {
    id: "f4",
    question: "How do I apply coupons?",
    answer:
      "During checkout, you will see a 'Apply Coupon' section. You can either select an available coupon from the list or manually type in your promo code and click 'Apply'.",
  },
  {
    id: "f5",
    question: "How do I contact support?",
    answer:
      "You can reach us instantly via the 'Live Chat' option on this page, or you can call us at our toll-free number. For non-urgent issues, feel free to submit a support ticket below.",
  },
];

export const HOME_FAQS: FaqEntry[] = [
  {
    id: "h1",
    question: "What is Foodiq?",
    answer:
      "Foodiq is an online food delivery platform where you can order from top restaurants in Hyderabad with fast delivery.",
  },
  {
    id: "h2",
    question: "How do I order food on Foodiq?",
    answer:
      "Browse restaurants, pick dishes, add them to your cart, and checkout. Track your order in real time until delivery.",
  },
  {
    id: "h3",
    question: "Does Foodiq deliver in Hyderabad?",
    answer:
      "Yes. Foodiq delivers across Hyderabad from popular local restaurants with fast online food delivery.",
  },
];
