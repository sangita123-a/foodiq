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
    <div className="flex h-full flex-col justify-between rounded-3xl border border-[#E5E7EB] bg-white p-8 shadow-sm md:p-10">
      <div>
        <h2 className="mb-8 text-2xl font-bold text-[#222222]">Contact Information</h2>

        <div className="space-y-6">
          {infoCards.map((info, idx) => (
            <div key={idx} className="flex items-start gap-5">
              <div className="mt-1 flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-[#E5E7EB] bg-[#F8F9FA]">
                <info.icon className="h-5 w-5 text-[#E23744]" />
              </div>
              <div>
                <p className="mb-1 text-xs font-bold uppercase tracking-widest text-[#555555]">
                  {info.title}
                </p>
                {info.href ? (
                  <a
                    href={info.href}
                    target={info.title === "Office Address" ? "_blank" : undefined}
                    rel="noopener noreferrer"
                    className="font-bold leading-relaxed text-[#222222] transition hover:text-[#E23744]"
                  >
                    {info.value}
                  </a>
                ) : (
                  <p className="font-bold leading-relaxed text-[#222222]">{info.value}</p>
                )}
              </div>
            </div>
          ))}
        </div>

        {contact.whatsapp_number && (
          <div className="mt-8 rounded-xl border border-[#E5E7EB] bg-[#F0FDF4] p-4">
            <p className="text-xs font-bold uppercase tracking-widest text-[#555555]">WhatsApp</p>
            <a
              href={`https://wa.me/${contact.whatsapp_number.replace(/\D/g, "")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 inline-block font-bold text-[#222222] hover:text-[#E23744]"
            >
              {contact.whatsapp_number}
            </a>
          </div>
        )}
      </div>

      {socials.length > 0 && (
        <div className="mt-12 border-t border-[#E5E7EB] pt-8">
          <h3 className="mb-4 font-bold text-[#222222]">Connect with us</h3>
          <div className="flex flex-wrap gap-3">
            {socials.map((s) => (
              <a
                key={s.label}
                href={s.url!}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full border border-[#E5E7EB] bg-[#F8F9FA] px-4 py-2 text-xs font-bold text-[#555555] transition hover:border-[#E23744] hover:text-[#E23744]"
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
