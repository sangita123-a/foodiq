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
  {
    id: "h4",
    question: "How do I place an order?",
    answer:
      "Browse restaurants, add your preferred dishes to the cart, enter your delivery details, and complete payment at checkout.",
  },
  {
    id: "h5",
    question: "Which payment methods are supported?",
    answer:
      "We support UPI, credit and debit cards, net banking, wallets, and Cash on Delivery where available.",
  },
  {
    id: "h6",
    question: "How do I contact customer support?",
    answer:
      "Visit Help & Support or email support@foodiq.com for assistance with your order or account.",
  },
];

export const CONTACT_FAQS: FaqEntry[] = [
  {
    id: "c1",
    question: "How long does delivery usually take?",
    answer:
      "Our average delivery time is 30-45 minutes depending on the restaurant's preparation time and your distance.",
  },
  {
    id: "c2",
    question: "What payment methods do you accept?",
    answer:
      "We accept all major Credit/Debit cards, UPI, popular digital wallets, and Cash on Delivery for select orders.",
  },
  {
    id: "c3",
    question: "How can I become a restaurant partner?",
    answer:
      "Please use the contact form and select Business as the reason. Our partnership team will contact you within 24 hours.",
  },
  {
    id: "c4",
    question: "Do you offer refunds for poor quality food?",
    answer:
      "If your order arrives in poor condition, please take a photo and submit a support ticket immediately. We will initiate a full refund.",
  },
];
