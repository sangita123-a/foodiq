"use client";

import useSWR from "swr";
import { Mail, MessageCircle, Phone } from "lucide-react";
import { helpCenterFetcher } from "@/services/helpCenterApi";

type Overview = {
  contact: { email: string; phone: string; whatsapp: string };
};

export default function ContactSupportPanel() {
  const { data } = useSWR<Overview>("/api/help-center/overview", helpCenterFetcher);
  const contact = data?.contact || {
    email: "support@foodiq.com",
    phone: "+91 1800 000 000",
    whatsapp: "+91 1800 000 000",
  };

  const wa = contact.whatsapp.replace(/\D/g, "");

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <a
        href={`mailto:${contact.email}`}
        className="flex items-center gap-4 bg-white rounded-2xl border border-border p-5 hover:border-primary transition"
      >
        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
          <Mail className="w-6 h-6 text-primary" />
        </div>
        <div>
          <p className="text-xs font-bold uppercase text-[#9CA3AF]">Email</p>
          <p className="font-bold text-sm text-foreground">{contact.email}</p>
        </div>
      </a>
      <a
        href={`tel:${contact.phone.replace(/\s/g, "")}`}
        className="flex items-center gap-4 bg-white rounded-2xl border border-border p-5 hover:border-primary transition"
      >
        <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center">
          <Phone className="w-6 h-6 text-emerald-600" />
        </div>
        <div>
          <p className="text-xs font-bold uppercase text-[#9CA3AF]">Phone</p>
          <p className="font-bold text-sm text-foreground">{contact.phone}</p>
        </div>
      </a>
      <a
        href={`https://wa.me/${wa}`}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-4 bg-white rounded-2xl border border-border p-5 hover:border-primary transition"
      >
        <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center">
          <MessageCircle className="w-6 h-6 text-green-600" />
        </div>
        <div>
          <p className="text-xs font-bold uppercase text-[#9CA3AF]">WhatsApp</p>
          <p className="font-bold text-sm text-foreground">{contact.whatsapp}</p>
        </div>
      </a>
    </div>
  );
}
