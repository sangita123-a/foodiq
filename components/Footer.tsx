"use client";

import Link from "next/link";
import { useSiteSettings } from "@/contexts/SiteSettingsContext";
import SafeImage from "@/components/ui/SafeImage";
import { DEFAULT_RESTAURANT_IMAGE } from "@/lib/images";

export default function Footer() {
  const { settings } = useSiteSettings();
  const company = settings.company_name || settings.app_name || "Foodiq";
  const year = new Date().getFullYear();

  return (
    <footer className="mt-12 sm:mt-16 lg:mt-20 w-full border-t border-[#262626] bg-[#1A1A1A] py-10 sm:py-14 text-white">
      <div className="container mx-auto flex flex-col items-center justify-between px-4 sm:px-6 lg:px-16 md:flex-row gap-8 md:gap-6">
        <div className="text-center md:text-left w-full md:w-auto">
          <div className="flex items-center justify-center md:justify-start text-2xl sm:text-3xl font-bold tracking-tight">
            {settings.logo_url ? (
              <SafeImage
                src={settings.logo_url}
                fallback={DEFAULT_RESTAURANT_IMAGE}
                alt={company}
                width={120}
                height={40}
                className="mr-3 h-10 w-auto max-w-[120px] !object-contain"
              />
            ) : null}
            <span className="text-white">Food</span>
            <span className="text-[#E23744]">iq</span>
          </div>
          <p className="mt-2 max-w-md text-xs sm:text-sm text-[#A3A3A3] mx-auto md:mx-0">
            {settings.footer_content ||
              "Discover amazing restaurants and delicious food delivered straight to your doorstep."}
          </p>
          <p className="mt-2 text-xs text-[#737373]">{settings.business_hours}</p>
        </div>

        <div className="grid grid-cols-2 sm:flex sm:flex-wrap justify-center gap-x-4 gap-y-3 sm:gap-4 text-xs sm:text-sm text-[#D4D4D4] w-full md:w-auto">
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
