"use client";

import Link from "next/link";
import { useSiteSettings } from "@/contexts/SiteSettingsContext";

export default function Footer() {
  const { settings } = useSiteSettings();
  const company = settings.company_name || settings.app_name || "Foodiq";
  const year = new Date().getFullYear();

  return (
    <footer className="mt-20 w-full border-t border-[#262626] bg-[#1A1A1A] py-14 text-white">
      <div className="container mx-auto flex flex-col items-center justify-between px-6 sm:px-8 lg:px-16 md:flex-row">
        <div className="mb-6 md:mb-0">
          <div className="flex items-center text-3xl font-bold tracking-tight">
            {settings.logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={settings.logo_url} alt={company} className="mr-3 h-10 w-auto" />
            ) : null}
            <span className="text-white">Food</span>
            <span className="text-[#E23744]">iq</span>
          </div>
          <p className="mt-2 max-w-md text-sm text-[#A3A3A3]">
            {settings.footer_content ||
              "Discover amazing restaurants and delicious food delivered straight to your doorstep."}
          </p>
          <p className="mt-2 text-xs text-[#737373]">{settings.business_hours}</p>
        </div>

        <div className="flex flex-wrap justify-center gap-4 text-sm text-[#D4D4D4] sm:gap-6">
          <Link href="/about" className="transition-colors hover:text-[#E23744]">
            About
          </Link>
          <Link href="/order-online" className="transition-colors hover:text-[#E23744]">
            Order Online
          </Link>
          <Link href="/privacy-policy" className="transition-colors hover:text-[#E23744]">
            Privacy Policy
          </Link>
          <Link href="/terms-of-service" className="transition-colors hover:text-[#E23744]">
            Terms of Service
          </Link>
          <Link href="/contact" className="transition-colors hover:text-[#E23744]">
            Contact Us
          </Link>
          <Link href="/help-support" className="transition-colors hover:text-[#E23744]">
            Support
          </Link>
        </div>
      </div>
      <div className="mt-12 text-center text-xs text-[#737373]">
        &copy; {year} {company}. All rights reserved.
      </div>
    </footer>
  );
}
