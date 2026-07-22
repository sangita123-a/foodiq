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
    <div className="flex h-full flex-col justify-between rounded-2xl border border-border bg-white p-4 shadow-sm max-md:rounded-xl max-md:p-4 md:rounded-3xl md:p-10">
      <div>
        <h2 className="mb-4 text-base font-bold text-foreground max-md:mb-4 max-md:text-base md:mb-8 md:text-2xl">Contact Information</h2>

        <div className="space-y-3 max-md:space-y-3 md:space-y-6">
          {infoCards.map((info, idx) => (
            <div key={idx} className="flex items-start gap-3 max-md:gap-3 md:gap-5">
              <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border bg-[#F8F9FA] max-md:h-9 max-md:w-9 md:mt-1 md:h-12 md:w-12 md:rounded-xl">
                <info.icon className="h-4 w-4 text-primary max-md:h-4 max-md:w-4 md:h-5 md:w-5" />
              </div>
              <div className="min-w-0">
                <p className="mb-0.5 text-[10px] font-bold uppercase tracking-widest text-[#555555] max-md:text-[10px] md:mb-1 md:text-xs">
                  {info.title}
                </p>
                {info.href ? (
                  <a
                    href={info.href}
                    target={info.title === "Office Address" ? "_blank" : undefined}
                    rel="noopener noreferrer"
                    className="text-sm font-bold leading-snug text-foreground transition hover:text-primary max-md:text-sm md:leading-relaxed"
                  >
                    {info.value}
                  </a>
                ) : (
                  <p className="text-sm font-bold leading-snug text-foreground max-md:text-sm md:leading-relaxed">{info.value}</p>
                )}
              </div>
            </div>
          ))}
        </div>

        {contact.whatsapp_number && (
          <div className="mt-4 rounded-lg border border-border bg-[#F0FDF4] p-3 max-md:mt-4 max-md:p-3 md:mt-8 md:rounded-xl md:p-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#555555] max-md:text-[10px] md:text-xs">WhatsApp</p>
            <a
              href={`https://wa.me/${contact.whatsapp_number.replace(/\D/g, "")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-0.5 inline-block text-sm font-bold text-foreground hover:text-primary max-md:text-sm md:mt-1"
            >
              {contact.whatsapp_number}
            </a>
          </div>
        )}
      </div>

      {socials.length > 0 && (
        <div className="mt-6 border-t border-border pt-4 max-md:mt-6 max-md:pt-4 md:mt-12 md:pt-8">
          <h3 className="mb-2 text-sm font-bold text-foreground max-md:mb-2 max-md:text-sm md:mb-4">Connect with us</h3>
          <div className="flex flex-wrap gap-2 max-md:gap-2 md:gap-3">
            {socials.map((s) => (
              <a
                key={s.label}
                href={s.url!}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full border border-border bg-[#F8F9FA] px-3 py-1.5 text-[10px] font-bold text-[#555555] transition hover:border-primary hover:text-primary max-md:px-3 max-md:py-1.5 max-md:text-[10px] md:px-4 md:py-2 md:text-xs"
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
