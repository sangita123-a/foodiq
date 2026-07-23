"use client";

import { Phone, Clock, AlertTriangle } from "lucide-react";
import SupportModal from "@/components/support/SupportModal";
import { useSiteSettings } from "@/contexts/SiteSettingsContext";

type Props = {
  open: boolean;
  onClose: () => void;
};

export default function CallSupportModal({ open, onClose }: Props) {
  const { settings } = useSiteSettings();
  const phone = settings.support_phone || "+91 1800 000 000";
  const hours = settings.business_hours || "24/7 Customer Care";
  const tel = phone.replace(/[^\d+]/g, "");

  return (
    <SupportModal open={open} onClose={onClose} title="Call Support">
      <div className="space-y-5">
        <div className="rounded-2xl border border-border bg-white p-5">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-purple-500/10 border border-purple-500/20">
            <Phone className="h-5 w-5 text-purple-400" />
          </div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#9CA3AF] mb-1">
            Customer Care Number
          </p>
          <a
            href={`tel:${tel}`}
            className="text-2xl font-black text-foreground hover:text-primary transition-colors"
          >
            {phone}
          </a>
        </div>

        <div className="rounded-2xl border border-border bg-white p-5">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10 border border-blue-500/20">
            <Clock className="h-5 w-5 text-blue-400" />
          </div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#9CA3AF] mb-1">
            Working Hours
          </p>
          <p className="text-lg font-bold text-foreground">{hours}</p>
        </div>

        <div className="rounded-2xl border border-border bg-white p-5">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-red-500/10 border border-red-500/20">
            <AlertTriangle className="h-5 w-5 text-red-500" />
          </div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#9CA3AF] mb-1">
            Emergency Support
          </p>
          <p className="text-sm leading-relaxed text-gray-text mb-3">
            For active order emergencies (rider stuck, wrong delivery address, safety concerns),
            call customer care and press <strong className="text-foreground">9</strong> for priority
            routing. Keep your Order ID ready.
          </p>
          <a
            href={`tel:${tel}`}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3.5 font-bold text-white sm:hidden"
          >
            <Phone className="h-4 w-4" />
            Call Now
          </a>
        </div>
      </div>
    </SupportModal>
  );
}
