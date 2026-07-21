"use client";

import { useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import FoodiqAiChat from "@/components/help-center/FoodiqAiChat";
import LiveSupportChat from "@/components/help-center/LiveSupportChat";
import HelpTicketPanel from "@/components/help-center/HelpTicketPanel";
import HelpFaqSection from "@/components/help-center/HelpFaqSection";
import ContactSupportPanel from "@/components/help-center/ContactSupportPanel";
import { Headphones, MessageSquare, Bot, Ticket, BookOpen, Phone } from "lucide-react";

type Tab = "ai" | "live" | "tickets" | "faq" | "contact";

export default function HelpCenterPage() {
  const [tab, setTab] = useState<Tab>("ai");
  const [aiSessionId, setAiSessionId] = useState<string>();

  const tabs: { id: Tab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: "ai", label: "Foodiq AI", icon: Bot },
    { id: "live", label: "Live Chat", icon: MessageSquare },
    { id: "tickets", label: "Tickets", icon: Ticket },
    { id: "faq", label: "FAQs", icon: BookOpen },
    { id: "contact", label: "Contact", icon: Phone },
  ];

  return (
    <main className="min-h-screen bg-background pt-[90px]">
      <Navbar />

      <div className="container mx-auto px-4 md:px-8 py-10 max-w-6xl">
        <div className="mb-8 text-center md:text-left">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest mb-4">
            <Headphones className="w-3.5 h-3.5" /> AI Support Center
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-foreground mb-2">How can we help?</h1>
          <p className="text-gray-text max-w-2xl">
            Get instant answers from Foodiq AI, chat with a support agent, browse FAQs, or create a ticket.
          </p>
        </div>

        <div className="flex flex-wrap gap-2 mb-8 justify-center md:justify-start">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition ${
                tab === t.id
                  ? "bg-primary text-white shadow-lg shadow-primary/20"
                  : "bg-white border border-border text-gray-text hover:border-primary/30"
              }`}
            >
              <t.icon className="w-4 h-4" /> {t.label}
            </button>
          ))}
        </div>

        {tab === "ai" && (
          <div className="max-w-2xl mx-auto">
            <FoodiqAiChat onSessionId={setAiSessionId} />
          </div>
        )}

        {tab === "live" && (
          <div className="max-w-2xl mx-auto">
            <LiveSupportChat />
          </div>
        )}

        {tab === "tickets" && <HelpTicketPanel aiSessionId={aiSessionId} />}

        {tab === "faq" && <HelpFaqSection />}

        {tab === "contact" && <ContactSupportPanel />}
      </div>

      <Footer />
    </main>
  );
}
