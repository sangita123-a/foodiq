"use client";

import { MapPin, Phone, Mail, Clock, Globe } from "lucide-react";
import { useSiteSettings } from "@/contexts/SiteSettingsContext";
import { useContactInfo } from "@/hooks/useContactInfo";

function telHref(phone: string) {
  return `tel:${phone.replace(/\s/g, "")}`;
}

function mapsHref(address: string) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
}

export default function ContactInfo() {
  const { settings } = useSiteSettings();
  const { contact } = useContactInfo();

  const infoCards = [
    {
      icon: MapPin,
      title: "Office Address",
      value: contact.office_address,
      href: mapsHref(contact.office_address),
    },
    {
      icon: Phone,
      title: "Phone",
      value: contact.phone_number,
      href: telHref(contact.phone_number),
    },
    {
      icon: Mail,
      title: "Email",
      value: contact.email,
      href: `mailto:${contact.email}`,
    },
    {
      icon: Clock,
      title: "Business Hours",
      value: contact.business_hours,
    },
    {
      icon: Globe,
      title: "Website",
      value: contact.website?.replace(/^https?:\/\//, ""),
      href: contact.website?.startsWith("http") ? contact.website : `https://${contact.website}`,
    },
  ];

  const socials = [
    { label: "Instagram", url: settings.instagram_url },
    { label: "Facebook", url: settings.facebook_url },
    { label: "Twitter", url: settings.twitter_url },
    { label: "LinkedIn", url: settings.linkedin_url },
    { label: "YouTube", url: settings.youtube_url },
  ].filter((s) => s.url);

  return (
    <div className="flex h-full flex-col justify-between rounded-2xl border border-border bg-white p-3 shadow-sm max-md:rounded-lg max-md:p-3 md:rounded-3xl md:p-10">
      <div>
        <h2 className="mb-2 text-sm font-bold text-foreground max-md:mb-2 max-md:text-sm md:mb-8 md:text-2xl">Contact Information</h2>

        <div className="grid grid-cols-1 gap-2 max-md:grid-cols-1 max-md:gap-2 md:space-y-6">
          {infoCards.map((info, idx) => (
            <div key={idx} className="flex items-start gap-2 max-md:gap-2 md:gap-5">
              <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-border bg-[#F8F9FA] max-md:h-7 max-md:w-7 md:mt-1 md:h-12 md:w-12 md:rounded-xl">
                <info.icon className="h-3.5 w-3.5 text-primary max-md:h-3.5 max-md:w-3.5 md:h-5 md:w-5" />
              </div>
              <div className="min-w-0">
                <p className="mb-0 text-[9px] font-bold uppercase tracking-wider text-[#555555] max-md:text-[9px] md:mb-1 md:text-xs">
                  {info.title}
                </p>
                {info.href ? (
                  <a
                    href={info.href}
                    target={info.title === "Office Address" ? "_blank" : undefined}
                    rel="noopener noreferrer"
                    className="text-xs font-bold leading-snug text-foreground transition hover:text-primary max-md:line-clamp-2 max-md:text-xs md:leading-relaxed"
                  >
                    {info.value}
                  </a>
                ) : (
                  <p className="text-xs font-bold leading-snug text-foreground max-md:text-xs md:leading-relaxed">{info.value}</p>
                )}
              </div>
            </div>
          ))}
        </div>

        {contact.whatsapp_number && (
          <div className="mt-2 rounded-md border border-border bg-[#F0FDF4] p-2 max-md:mt-2 max-md:p-2 md:mt-8 md:rounded-xl md:p-4">
            <p className="text-[9px] font-bold uppercase tracking-wider text-[#555555] max-md:text-[9px] md:text-xs">WhatsApp</p>
            <a
              href={`https://wa.me/${contact.whatsapp_number.replace(/\D/g, "")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-0 inline-block text-xs font-bold text-foreground hover:text-primary max-md:text-xs md:mt-1"
            >
              {contact.whatsapp_number}
            </a>
          </div>
        )}
      </div>

      {socials.length > 0 && (
        <div className="mt-3 border-t border-border pt-2 max-md:mt-3 max-md:pt-2 md:mt-12 md:pt-8">
          <h3 className="mb-1.5 text-xs font-bold text-foreground max-md:mb-1.5 max-md:text-xs md:mb-4 md:text-sm">Connect with us</h3>
          <div className="flex flex-wrap gap-1.5 max-md:gap-1.5 md:gap-3">
            {socials.map((s) => (
              <a
                key={s.label}
                href={s.url!}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full border border-border bg-[#F8F9FA] px-2.5 py-1 text-[9px] font-bold text-[#555555] transition hover:border-primary hover:text-primary max-md:px-2.5 max-md:py-1 max-md:text-[9px] md:px-4 md:py-2 md:text-xs"
              >
                {s.label}
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
