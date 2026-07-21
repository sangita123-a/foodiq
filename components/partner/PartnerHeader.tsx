"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, User } from "lucide-react";
import SafeImage from "@/components/ui/SafeImage";
import { RESTAURANT_FALLBACK } from "@/lib/images";
import { usePartnerProfile } from "@/hooks/usePartnerData";
import { updatePartnerProfile } from "@/services/partnerApi";
import { mutate } from "swr";
import NotificationBell from "@/components/notifications/NotificationBell";
import MobileDrawer from "@/components/ui/MobileDrawer";
import PartnerSidebar from "@/components/partner/PartnerSidebar";

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
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
    <>
      <div className="h-16 sm:h-20 bg-background border-b border-border flex items-center justify-between px-3 sm:px-4 lg:px-8 sticky top-0 z-30 safe-top">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden touch-target flex items-center justify-center text-gray-text hover:text-foreground transition-colors p-2 -ml-1"
            aria-label="Open navigation menu"
          >
            <Menu className="w-6 h-6" />
          </button>

          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white flex items-center justify-center overflow-hidden border-2 border-border shrink-0">
              <SafeImage
                src={logo}
                fallback={RESTAURANT_FALLBACK}
                alt="Restaurant Logo"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="min-w-0">
              <h2 className="text-foreground font-black leading-none text-sm sm:text-base truncate">{name}</h2>
              <p className="text-[#9CA3AF] text-[10px] sm:text-xs mt-0.5 sm:mt-1 truncate">
                ID: #{id ? String(id).slice(0, 8) : "—"}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-4 shrink-0">
          <div className="flex items-center gap-2 sm:gap-3 bg-section px-2 sm:px-4 py-1.5 sm:py-2 rounded-full border border-border">
            <span
              className={`text-[10px] sm:text-xs font-bold uppercase tracking-wider hidden sm:inline ${
                open ? "text-green-400" : "text-[#9CA3AF]"
              }`}
            >
              {open ? "Accepting Orders" : "Closed"}
            </span>
            <button
              type="button"
              onClick={toggleOpen}
              className={`w-11 h-6 sm:w-12 rounded-full transition-colors relative touch-target ${
                open
                  ? "bg-green-500/20 border border-green-500/50"
                  : "bg-section border border-border"
              }`}
              aria-label={open ? "Close restaurant" : "Open restaurant"}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white absolute top-0.5 transition-all ${
                  open ? "left-6 sm:left-7 shadow-[0_0_10px_rgba(34,197,94,0.5)]" : "left-1"
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
            className="touch-target w-10 h-10 rounded-full bg-section border border-border flex items-center justify-center text-gray-text hover:text-foreground shrink-0"
          >
            <User className="w-5 h-5" />
          </Link>
        </div>
      </div>

      <MobileDrawer open={sidebarOpen} onClose={() => setSidebarOpen(false)} side="left" width="w-[min(280px,88vw)]">
        <PartnerSidebar variant="drawer" onNavigate={() => setSidebarOpen(false)} />
      </MobileDrawer>
    </>
  );
}
