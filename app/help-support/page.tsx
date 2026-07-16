"use client";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SupportHeader from "@/components/support/SupportHeader";
import QuickHelpCards from "@/components/support/QuickHelpCards";
import FaqAccordion, { FaqType } from "@/components/support/FaqAccordion";
import LiveChatCard from "@/components/support/LiveChatCard";
import SupportTicketForm from "@/components/support/SupportTicketForm";
import RecentTickets, { TicketType } from "@/components/support/RecentTickets";
import ContactInfo from "@/components/support/ContactInfo";

// Mock Data
const faqs: FaqType[] = [
  { id: "f1", question: "How do I track my order?", answer: "Once your order is confirmed, you can track it in real-time by going to the 'Live Order Tracking' page or clicking on the active order banner on your homepage. You will see the delivery partner's live location on the map." },
  { id: "f2", question: "How can I cancel an order?", answer: "You can cancel an order within 60 seconds of placing it directly from the 'My Orders' page without any penalty. If the restaurant has already started preparing your food, cancellation may incur a small fee." },
  { id: "f3", question: "How do refunds work?", answer: "If your order is cancelled, the refund is initiated immediately. For UPI and Wallets, it reflects within 2-4 hours. For Credit/Debit cards, it may take 5-7 business days depending on your bank." },
  { id: "f4", question: "How do I apply coupons?", answer: "During checkout, you will see a 'Apply Coupon' section. You can either select an available coupon from the list or manually type in your promo code and click 'Apply'." },
  { id: "f5", question: "How do I contact support?", answer: "You can reach us instantly via the 'Live Chat' option on this page, or you can call us at our toll-free number. For non-urgent issues, feel free to submit a support ticket below." }
];

const recentTickets: TicketType[] = [
  { id: "TKT-8902", subject: "Food spilled during delivery", status: "Resolved", date: "Oct 12, 2026" },
  { id: "TKT-9105", subject: "Refund not received for cancelled order", status: "In Progress", date: "Yesterday, 04:30 PM" },
  { id: "TKT-9144", subject: "Promo code WELCOME100 not working", status: "Open", date: "Today, 10:15 AM" },
];

export default function HelpSupportPage() {
  return (
    <main className="min-h-screen bg-[#0B0B0B] relative selection:bg-[var(--color-primary)] selection:text-white pt-[90px]">
      <Navbar />

      <div className="container mx-auto px-4 md:px-8 py-12 max-w-7xl">
        
        <SupportHeader />
        
        <QuickHelpCards />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-8">
          {/* Main Content Area */}
          <div className="lg:col-span-8 flex flex-col gap-8">
            <FaqAccordion faqs={faqs} />
            <SupportTicketForm />
          </div>

          {/* Sidebar Area */}
          <div className="lg:col-span-4 flex flex-col gap-8">
            <div className="h-[300px]">
              <LiveChatCard />
            </div>
            <RecentTickets tickets={recentTickets} />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <ContactInfo />
        </div>

      </div>

      <Footer />
    </main>
  );
}
