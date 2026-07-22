"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  Apple,
  ArrowUp,
  Mail,
  MapPin,
  Phone,
  Play,
} from "lucide-react";
import { useSiteSettings } from "@/contexts/SiteSettingsContext";
import { useToast } from "@/contexts/ToastContext";
import SafeImage from "@/components/ui/SafeImage";
import { DEFAULT_RESTAURANT_IMAGE } from "@/lib/images";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const FOOTER_BG = "bg-[#1C1C1C]";
const FOOTER_TEXT = "text-white";
const FOOTER_MUTED = "text-[#B5B5B5]";
const FOOTER_LINK =
  "text-[#B5B5B5] transition-colors duration-200 hover:text-[#EF4F5F] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#EF4F5F] focus-visible:ring-offset-2 focus-visible:ring-offset-[#1C1C1C]";
const FOOTER_BORDER = "border-white/10";

const linkClass = `rounded-sm ${FOOTER_LINK}`;

const sectionTitleClass =
  "mb-1 text-[9px] font-bold uppercase tracking-wider text-white max-md:mb-1 md:mb-2.5 md:text-xs";

function telHref(phone: string) {
  return `tel:${phone.replace(/\s/g, "")}`;
}

function mapsHref(address: string) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
  );
}

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}

function LinkedinIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
      <rect width="4" height="12" x="2" y="9" />
      <circle cx="4" cy="4" r="2" />
    </svg>
  );
}

function YoutubeIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17" />
      <path d="m10 15 5-3-5-3z" />
    </svg>
  );
}

type FooterLink = { label: string; href: string };

const COMPANY_LINKS: FooterLink[] = [
  { label: "About Us", href: "/about" },
  { label: "Careers", href: "/careers" },
  { label: "Blog", href: "/blog" },
  { label: "Press", href: "/press" },
];

const SUPPORT_LINKS: FooterLink[] = [
  { label: "Help Center", href: "/help" },
  { label: "Contact Us", href: "/contact" },
  { label: "FAQs", href: "/faq" },
  { label: "Terms & Conditions", href: "/terms" },
  { label: "Privacy Policy", href: "/privacy" },
  { label: "Refund Policy", href: "/refund-policy" },
];

const RESTAURANT_LINKS: FooterLink[] = [
  { label: "Partner With Us", href: "/partner" },
  { label: "Add Your Restaurant", href: "/restaurant/register" },
  { label: "Restaurant Login", href: "/restaurant/login" },
];

const CUSTOMER_LINKS: FooterLink[] = [
  { label: "My Orders", href: "/orders" },
  { label: "Wishlist", href: "/wishlist" },
  { label: "Cart", href: "/cart" },
  { label: "My Account", href: "/profile" },
];

const QUICK_LINKS: FooterLink[] = [
  { label: "Home", href: "/" },
  { label: "Restaurants", href: "/restaurants" },
  { label: "Categories", href: "/categories" },
  { label: "Trending Dishes", href: "/trending-dishes" },
];

function FooterLinkSection({
  title,
  links,
  id,
}: {
  title: string;
  links: FooterLink[];
  id: string;
}) {
  return (
    <nav aria-labelledby={id} className="flex flex-col items-start">
      <h3 id={id} className={sectionTitleClass}>
        {title}
      </h3>
      <ul className="space-y-1 text-[10px] max-md:space-y-0.5 md:space-y-1.5 md:text-sm">
        {links.map((link) => (
          <li key={link.href}>
            <Link href={link.href} className={linkClass}>
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export default function FooterContent() {
  const { settings } = useSiteSettings();
  const { showToast } = useToast();
  const year = new Date().getFullYear();

  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [subscribing, setSubscribing] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);

  const socialLinks = [
    {
      label: "Facebook",
      href: settings.facebook_url || "https://facebook.com/foodiq",
      Icon: FacebookIcon,
    },
    {
      label: "Instagram",
      href: settings.instagram_url || "https://instagram.com/foodiq",
      Icon: InstagramIcon,
    },
    {
      label: "Twitter/X",
      href: settings.twitter_url || "https://twitter.com/foodiq",
      Icon: XIcon,
    },
    {
      label: "LinkedIn",
      href: settings.linkedin_url || "https://linkedin.com/company/foodiq",
      Icon: LinkedinIcon,
    },
    {
      label: "YouTube",
      href: settings.youtube_url || "https://youtube.com/@foodiq",
      Icon: YoutubeIcon,
    },
  ];

  const googlePlayUrl =
    settings.google_play_url ||
    "https://play.google.com/store/apps/details?id=com.foodiq.app";
  const appStoreUrl =
    settings.app_store_url || "https://apps.apple.com/app/foodiq/id6470000000";

  useEffect(() => {
    const onScroll = () => setShowBackToTop(window.scrollY > 400);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const handleSubscribe = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const trimmed = email.trim().toLowerCase();
    if (!trimmed || !EMAIL_RE.test(trimmed)) {
      setEmailError("Please enter a valid email address");
      return;
    }
    setEmailError("");
    setSubscribing(true);
    try {
      const res = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmed }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        showToast(
          data.message || "Successfully subscribed to the newsletter",
          "success"
        );
        setEmail("");
      } else {
        showToast(
          data.message || "Unable to subscribe right now. Please try again.",
          "error"
        );
      }
    } catch {
      showToast("Unable to subscribe right now. Please try again.", "error");
    } finally {
      setSubscribing(false);
    }
  };

  return (
    <>
      <footer
        className={`mt-3 w-full border-t ${FOOTER_BORDER} ${FOOTER_BG} py-3 ${FOOTER_TEXT} max-md:py-3 sm:mt-10 sm:py-8 lg:mt-14`}
        role="contentinfo"
      >
        <div className="container mx-auto px-3 max-md:px-3 sm:px-6 lg:px-16">
          <div className="grid grid-cols-2 gap-3 text-left max-md:grid-cols-2 max-md:gap-2.5 sm:grid-cols-3 lg:grid-cols-6 lg:gap-6">
            <div className="col-span-2 flex flex-col items-start sm:col-span-3 lg:col-span-2">
              <div className="flex items-center justify-start text-base font-bold tracking-tight max-md:text-sm sm:text-2xl">
                {settings.logo_url ? (
                  <SafeImage
                    src={settings.logo_url}
                    fallback={DEFAULT_RESTAURANT_IMAGE}
                    alt={settings.company_name || "Foodiq"}
                    width={120}
                    height={40}
                    className="mr-1.5 h-6 w-auto max-w-[72px] !object-contain max-md:mr-1.5 max-md:h-6 md:mr-2 md:h-8 md:max-w-[96px]"
                  />
                ) : null}
                <span className="text-white">Foodiq</span>
              </div>
              <p className={`mt-1 max-w-sm text-[10px] leading-snug max-md:line-clamp-2 sm:text-sm ${FOOTER_MUTED}`}>
                {settings.footer_content ||
                  "Discover amazing restaurants and delicious food delivered straight to your doorstep."}
              </p>
              <p className={`mt-1 text-[10px] max-md:text-[10px] md:text-xs ${FOOTER_MUTED}`}>
                {settings.business_hours}
              </p>

              <div className="mt-2 max-md:mt-2 md:mt-4">
                <p className={`mb-1.5 text-[9px] font-bold uppercase tracking-wider max-md:mb-1 md:mb-2 md:text-[10px] ${FOOTER_MUTED}`}>
                  Follow Us
                </p>
                <div className="flex flex-wrap justify-start gap-1 max-md:gap-1 md:gap-1.5">
                  {socialLinks.map(({ label, href, Icon }) => (
                    <a
                      key={label}
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`Foodiq on ${label}`}
                      className={`flex h-7 w-7 items-center justify-center rounded-full border ${FOOTER_BORDER} bg-white/5 text-[#B5B5B5] transition-all duration-200 hover:scale-105 hover:border-[#EF4F5F] hover:bg-[#EF4F5F]/10 hover:text-[#EF4F5F] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#EF4F5F] focus-visible:ring-offset-2 focus-visible:ring-offset-[#1C1C1C] max-md:h-7 max-md:w-7 md:h-8 md:w-8`}
                    >
                      <Icon className="h-3 w-3 md:h-3.5 md:w-3.5" />
                    </a>
                  ))}
                </div>
              </div>

              <div className="mt-2 flex flex-wrap gap-1.5 max-md:mt-2 sm:mt-4 md:gap-2">
                <a
                  href={appStoreUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Download Foodiq on the App Store"
                  className={`flex items-center gap-1.5 rounded-lg border ${FOOTER_BORDER} bg-white/5 px-2.5 py-1.5 text-white transition-colors duration-200 hover:border-[#EF4F5F]/50 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#EF4F5F] focus-visible:ring-offset-2 focus-visible:ring-offset-[#1C1C1C] max-md:px-2 max-md:py-1 md:px-3 md:py-2`}
                >
                  <Apple className="h-4 w-4 shrink-0 md:h-5 md:w-5" aria-hidden="true" />
                  <span className="flex flex-col text-left leading-none">
                    <span className="text-[7px] font-medium text-[#B5B5B5] max-md:text-[7px] md:text-[8px]">Download on the</span>
                    <span className="text-[10px] font-bold max-md:text-[10px] md:text-xs">App Store</span>
                  </span>
                </a>
                <a
                  href={googlePlayUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Get Foodiq on Google Play"
                  className={`flex items-center gap-1.5 rounded-lg border ${FOOTER_BORDER} bg-white/5 px-2.5 py-1.5 text-white transition-colors duration-200 hover:border-[#EF4F5F]/50 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#EF4F5F] focus-visible:ring-offset-2 focus-visible:ring-offset-[#1C1C1C] max-md:px-2 max-md:py-1 md:px-3 md:py-2`}
                >
                  <Play
                    className="h-3.5 w-3.5 shrink-0 fill-current md:h-4 md:w-4"
                    aria-hidden="true"
                  />
                  <span className="flex flex-col text-left leading-none">
                    <span className="text-[7px] font-medium uppercase text-[#B5B5B5] max-md:text-[7px] md:text-[8px]">
                      Get it on
                    </span>
                    <span className="text-[10px] font-bold max-md:text-[10px] md:text-xs">Google Play</span>
                  </span>
                </a>
              </div>
            </div>

            <FooterLinkSection
              title="Company"
              links={COMPANY_LINKS}
              id="footer-company"
            />
            <FooterLinkSection
              title="Support"
              links={SUPPORT_LINKS}
              id="footer-support"
            />
            <FooterLinkSection
              title="Restaurants"
              links={RESTAURANT_LINKS}
              id="footer-restaurants"
            />
            <FooterLinkSection
              title="Customer"
              links={CUSTOMER_LINKS}
              id="footer-customer"
            />
            <FooterLinkSection
              title="Quick Links"
              links={QUICK_LINKS}
              id="footer-quick-links"
            />
          </div>

          <div className={`mt-3 border-t ${FOOTER_BORDER} pt-3 max-md:mt-2.5 max-md:pt-2.5 lg:mt-7 lg:pt-5`}>
            <div className="grid gap-4 lg:grid-cols-2 lg:gap-8">
              <div>
                <h3 className={sectionTitleClass}>Newsletter</h3>
                <p className={`mb-2 text-[10px] leading-snug max-md:mb-1.5 max-md:line-clamp-2 sm:text-sm ${FOOTER_MUTED}`}>
                  Subscribe for exclusive offers, new restaurant launches, and
                  food inspiration.
                </p>
                <form
                  onSubmit={handleSubscribe}
                  className="flex max-w-md flex-col gap-1.5 max-md:gap-1.5 sm:flex-row sm:gap-2"
                  noValidate
                >
                  <div className="flex-1">
                    <label htmlFor="footer-newsletter-email" className="sr-only">
                      Email address
                    </label>
                    <input
                      id="footer-newsletter-email"
                      type="email"
                      inputMode="email"
                      autoComplete="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (emailError) setEmailError("");
                      }}
                      placeholder="Enter your email"
                      aria-invalid={emailError ? "true" : "false"}
                      aria-describedby={
                        emailError ? "footer-newsletter-error" : undefined
                      }
                      className="w-full rounded-lg border border-white/15 bg-[#2A2A2A] px-3 py-2 text-xs text-white placeholder:text-[#888888] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#EF4F5F] max-md:h-9 max-md:py-0 md:rounded-xl md:px-4 md:py-2 md:text-sm"
                    />
                    {emailError ? (
                      <p
                        id="footer-newsletter-error"
                        role="alert"
                        className="mt-0.5 text-[10px] text-[#EF4F5F] md:text-xs"
                      >
                        {emailError}
                      </p>
                    ) : null}
                  </div>
                  <button
                    type="submit"
                    disabled={subscribing}
                    className="shrink-0 rounded-lg bg-[#EF4F5F] px-4 py-2 text-xs font-semibold text-white transition-colors duration-200 hover:bg-[#e03e4e] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#EF4F5F] focus-visible:ring-offset-2 focus-visible:ring-offset-[#1C1C1C] disabled:cursor-not-allowed disabled:opacity-60 max-md:h-9 max-md:py-0 md:rounded-xl md:px-5 md:py-2 md:text-sm"
                  >
                    {subscribing ? "Subscribing…" : "Subscribe"}
                  </button>
                </form>
              </div>

              <div>
                <h3 className={sectionTitleClass}>Contact Us</h3>
                <ul className="space-y-2 text-[10px] max-md:space-y-1.5 sm:text-sm">
                  <li>
                    <a
                      href={`mailto:${settings.support_email}`}
                      suppressHydrationWarning
                      className={`inline-flex items-start gap-2 ${linkClass}`}
                    >
                      <Mail
                        className="mt-0.5 h-3 w-3 shrink-0 text-[#EF4F5F] md:h-3.5 md:w-3.5"
                        aria-hidden="true"
                      />
                      <span suppressHydrationWarning>{settings.support_email}</span>
                    </a>
                  </li>
                  <li>
                    <a
                      href={telHref(settings.support_phone)}
                      suppressHydrationWarning
                      className={`inline-flex items-start gap-2 ${linkClass}`}
                    >
                      <Phone
                        className="mt-0.5 h-3 w-3 shrink-0 text-[#EF4F5F] md:h-3.5 md:w-3.5"
                        aria-hidden="true"
                      />
                      <span suppressHydrationWarning>{settings.support_phone}</span>
                    </a>
                  </li>
                  <li>
                    <a
                      href={mapsHref(settings.office_address)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`inline-flex items-start gap-2 ${linkClass}`}
                    >
                      <MapPin
                        className="mt-0.5 h-3 w-3 shrink-0 text-[#EF4F5F] md:h-3.5 md:w-3.5"
                        aria-hidden="true"
                      />
                      <span suppressHydrationWarning>{settings.office_address}</span>
                    </a>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <p className={`mt-2.5 border-t ${FOOTER_BORDER} pt-2.5 text-center text-[9px] max-md:mt-2 max-md:pt-2 md:mt-6 md:pt-4 md:text-xs ${FOOTER_MUTED}`}>
            &copy; {year} Foodiq. All Rights Reserved.
          </p>
        </div>
      </footer>

      {showBackToTop ? (
        <button
          type="button"
          onClick={scrollToTop}
          aria-label="Back to top"
          className="fixed bottom-6 right-6 z-50 flex h-11 w-11 items-center justify-center rounded-full bg-[#EF4F5F] text-white shadow-lg transition-all hover:bg-[#e03e4e] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#EF4F5F] focus-visible:ring-offset-2"
        >
          <ArrowUp className="h-5 w-5" aria-hidden="true" />
        </button>
      ) : null}
    </>
  );
}
