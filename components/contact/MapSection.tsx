"use client";

import { useSiteSettings } from "@/contexts/SiteSettingsContext";
import { useContactInfo } from "@/hooks/useContactInfo";

export default function MapSection() {
  const { settings } = useSiteSettings();
  const { contact } = useContactInfo();
  const embedUrl =
    settings.google_maps_embed_url ||
    `https://maps.google.com/maps?q=${encodeURIComponent(contact.office_address)}&output=embed`;

  return (
    <div className="container mx-auto px-3 py-4 max-md:px-3 max-md:py-4 md:px-8 md:py-20">
      <div className="relative h-[180px] overflow-hidden rounded-xl border border-border bg-white max-md:h-[180px] max-md:rounded-xl md:h-[500px] md:rounded-3xl">
        <iframe
          title="Office location map"
          src={embedUrl}
          className="absolute inset-0 h-full w-full border-0"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          allowFullScreen
        />
      </div>
    </div>
  );
}
