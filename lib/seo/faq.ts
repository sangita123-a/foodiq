/** Shared FAQ copy for help page UI and FAQPage JSON-LD. */
export type FaqEntry = {
  id: string;
  question: string;
  answer: string;
};

export const HELP_SUPPORT_FAQS: FaqEntry[] = [
  {
    id: "f1",
    question: "How to cancel an order?",
    answer:
      "You can cancel an order within 60 seconds of placing it from My Orders without any penalty. If the restaurant has already started preparing your food, cancellation may incur a small fee and refund timing depends on your payment method.",
  },
  {
    id: "f2",
    question: "How to request a refund?",
    answer:
      "Open Payment Issues on Help & Support to review refund status, or raise an Order Problem ticket for quality issues. Approved UPI/wallet refunds usually reflect in 2–4 hours; card refunds may take 5–7 business days.",
  },
  {
    id: "f3",
    question: "How long does delivery take?",
    answer:
      "Most Foodiq deliveries arrive within 30–45 minutes depending on distance, restaurant prep time, and traffic. Use Track an Order for a live ETA and delivery partner updates.",
  },
  {
    id: "f4",
    question: "How to contact support?",
    answer:
      "Use Live Chat for urgent help, Call Support for phone assistance, or Email Support for detailed queries. Logged-in users can also submit Order Problem tickets with photos.",
  },
  {
    id: "f5",
    question: "Payment failed.",
    answer:
      "If a payment fails, the order is not confirmed and any temporary hold is released by your bank. Open Payment Issues to retry the payment or place the order again with another method.",
  },
  {
    id: "f6",
    question: "Track my order.",
    answer:
      "Click Track an Order on this page, enter your Order ID, and view restaurant details, items, payment method, delivery address, partner info, and an animated status timeline through Delivered.",
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
      "Browse restaurants on our order-online page, explore food categories and trending dishes, apply offers at checkout, and track your order in real time until delivery.",
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
      "Visit our contact page or Help & Support for assistance with orders, offers, and your account. Email support@foodiq.com for non-urgent issues.",
  },
];

export const CONTACT_FAQS: FaqEntry[] = [
  {
    id: "c1",
    question: "How long does delivery usually take?",
    answer:
      "Our average delivery time is 30-45 minutes depending on the restaurant's preparation time and your distance. Browse restaurants or trending dishes to start a new order.",
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
