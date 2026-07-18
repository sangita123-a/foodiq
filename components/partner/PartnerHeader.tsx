"use client";

import Link from "next/link";
import { Menu, User } from "lucide-react";
import SafeImage from "@/components/ui/SafeImage";
import { RESTAURANT_FALLBACK } from "@/lib/images";
import { usePartnerProfile } from "@/hooks/usePartnerData";
import { updatePartnerProfile } from "@/services/partnerApi";
import { mutate } from "swr";
import NotificationBell from "@/components/notifications/NotificationBell";

type PartnerHeaderProps = {
  restaurantName?: string;
  restaurantId?: string;
  logoUrl?: string;
  isActive?: boolean;
};

export default function PartnerHeader({
  restaurantName,
  restaurantId,
  logoUrl,
  isActive,
}: PartnerHeaderProps) {
  const { data: profile } = usePartnerProfile();

  const name =
    restaurantName ||
    (profile as { name?: string } | undefined)?.name ||
    "Your Restaurant";
  const id = restaurantId || (profile as { id?: string } | undefined)?.id || "";
  const logo =
    logoUrl ||
    (profile as { logo_url?: string; image_url?: string } | undefined)?.logo_url ||
    (profile as { image_url?: string } | undefined)?.image_url ||
    RESTAURANT_FALLBACK;
  const open =
    isActive ?? ((profile as { is_active?: boolean } | undefined)?.is_active !== false);

  const toggleOpen = async () => {
    if (!profile) return;
    await updatePartnerProfile({ is_active: !open });
    mutate("/api/partner/profile");
    mutate("/api/partner/dashboard");
  };

  return (
    <div className="h-20 bg-[#FFFFFF] border-b border-[#E5E7EB] flex items-center justify-between px-4 lg:px-8 sticky top-0 z-30">
      <div className="flex items-center gap-4">
        <button type="button" className="lg:hidden text-[#6B7280] hover:text-[#111827] transition-colors">
          <Menu className="w-6 h-6" />
        </button>

        <div className="hidden sm:flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center overflow-hidden border-2 border-[#E5E7EB]">
            <SafeImage
              src={logo}
              fallback={RESTAURANT_FALLBACK}
              alt="Restaurant Logo"
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <h2 className="text-[#111827] font-black leading-none">{name}</h2>
            <p className="text-[#9CA3AF] text-xs mt-1">
              ID: #{id ? String(id).slice(0, 8) : "—"}
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-6">
        <div className="flex items-center gap-3 bg-[#F8FAFC] px-4 py-2 rounded-full border border-[#E5E7EB]">
          <span
            className={`text-xs font-bold uppercase tracking-wider ${
              open ? "text-green-400" : "text-[#9CA3AF]"
            }`}
          >
            {open ? "Accepting Orders" : "Closed"}
          </span>
          <button
            type="button"
            onClick={toggleOpen}
            className={`w-12 h-6 rounded-full transition-colors relative ${
              open
                ? "bg-green-500/20 border border-green-500/50"
                : "bg-[#F8FAFC] border border-[#E5E7EB]"
            }`}
          >
            <div
              className={`w-4 h-4 rounded-full bg-white absolute top-0.5 transition-all ${
                open ? "left-7 shadow-[0_0_10px_rgba(34,197,94,0.5)]" : "left-1"
              }`}
            />
          </button>
        </div>

        <NotificationBell
          endpoint="/api/partner/notifications"
          inboxHref="/partner/notifications"
        />

        <Link
          href="/partner/settings"
          className="w-10 h-10 rounded-full bg-[#F8FAFC] border border-[#E5E7EB] flex items-center justify-center text-[#6B7280] hover:text-[#111827]"
        >
          <User className="w-5 h-5" />
        </Link>
      </div>
    </div>
  );
}
