"use client";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SupportHeader from "@/components/support/SupportHeader";
import QuickHelpCards from "@/components/support/QuickHelpCards";
import FaqAccordion from "@/components/support/FaqAccordion";
import { HELP_SUPPORT_FAQS } from "@/lib/seo/faq";
import LiveChatCard from "@/components/support/LiveChatCard";
import SupportTicketForm from "@/components/support/SupportTicketForm";
import RecentTickets, { TicketType } from "@/components/support/RecentTickets";
import ContactInfo from "@/components/support/ContactInfo";

const faqs = HELP_SUPPORT_FAQS;

const recentTickets: TicketType[] = [
  { id: "TKT-8902", subject: "Food spilled during delivery", status: "Resolved", date: "Oct 12, 2026" },
  { id: "TKT-9105", subject: "Refund not received for cancelled order", status: "In Progress", date: "Yesterday, 04:30 PM" },
  { id: "TKT-9144", subject: "Promo code WELCOME100 not working", status: "Open", date: "Today, 10:15 AM" },
];

export default function HelpSupportPage() {
  return (
    <main className="min-h-screen bg-background relative selection:bg-[var(--color-primary)] selection:text-white pt-[90px]">
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
