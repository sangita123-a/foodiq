"use client";

import { useSiteSettings } from "@/contexts/SiteSettingsContext";

export default function MapSection() {
  const { settings } = useSiteSettings();
  const embedUrl =
    settings.google_maps_embed_url ||
    `https://maps.google.com/maps?q=${encodeURIComponent(settings.office_address)}&output=embed`;

  return (
    <div className="container mx-auto px-4 py-20 md:px-8">
      <div className="relative h-[400px] overflow-hidden rounded-3xl border border-[#E5E7EB] bg-white md:h-[500px]">
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
