"use client";

import { useSiteSettings } from "@/contexts/SiteSettingsContext";

export function DynamicLegalContent({ type }: { type: "privacy" | "terms" }) {
  const { settings } = useSiteSettings();
  const text =
    type === "privacy"
      ? settings.privacy_policy_text
      : settings.terms_of_service_text;

  if (text?.trim()) {
    return (
      <div className="prose max-w-none whitespace-pre-wrap text-[#555555]">
        {text}
      </div>
    );
  }

  return null;
}
