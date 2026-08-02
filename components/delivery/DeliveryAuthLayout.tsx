"use client";

import React, { ReactNode } from "react";
import Link from "next/link";
import { Bike, ArrowLeft, ShieldCheck } from "lucide-react";

interface DeliveryAuthLayoutProps {
  children: ReactNode;
  title: string;
  subtitle: string;
  badge?: string;
  showBackButton?: boolean;
  backHref?: string;
  maxWidth?: "md" | "2xl" | "4xl";
}

export default function DeliveryAuthLayout({
  children,
  title,
  subtitle,
  badge = "Delivery Partner",
  showBackButton = false,
  backHref = "/delivery/login",
  maxWidth = "md",
}: DeliveryAuthLayoutProps) {
  const widthClasses = {
    md: "max-w-md",
    "2xl": "max-w-2xl",
    "4xl": "max-w-4xl",
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-between selection:bg-primary/20 selection:text-primary font-sans antialiased">
      {/* Top Navbar Header */}
      <header className="w-full border-b border-border bg-white sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-primary text-white flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
              <Bike className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-lg leading-none text-foreground tracking-tight">
                Food<span className="text-primary">iq</span>
              </span>
              <span className="text-[10px] font-semibold tracking-wider text-muted uppercase mt-0.5">
                Delivery
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-primary-soft text-primary border border-primary/20">
              <ShieldCheck className="w-3.5 h-3.5" />
              {badge}
            </span>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-10 my-auto">
        <div className={`w-full ${widthClasses[maxWidth]} mx-auto`}>
          {showBackButton && (
            <Link
              href={backHref}
              className="inline-flex items-center gap-2 text-xs font-semibold text-gray-text hover:text-primary mb-4 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Link>
          )}

          <div className="bg-white border border-border rounded-2xl p-6 sm:p-8 md:p-10 shadow-card">
            {/* Header section */}
            <div className="text-center mb-8">
              <div className="w-12 h-12 rounded-2xl bg-primary-soft text-primary mx-auto flex items-center justify-center mb-4 border border-primary/10">
                <Bike className="w-6 h-6" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight mb-2">
                {title}
              </h1>
              <p className="text-sm text-gray-text max-w-sm mx-auto leading-relaxed">
                {subtitle}
              </p>
            </div>

            {/* Form body */}
            {children}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-border py-4 bg-white text-center text-xs text-muted">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>&copy; {new Date().getFullYear()} Foodiq Partner Network. All rights reserved.</span>
          <div className="flex items-center gap-4 text-gray-text font-medium">
            <Link href="/terms-of-service" className="hover:text-primary transition-colors">
              Terms
            </Link>
            <span>&bull;</span>
            <Link href="/privacy-policy" className="hover:text-primary transition-colors">
              Privacy Policy
            </Link>
            <span>&bull;</span>
            <Link href="/help-support" className="hover:text-primary transition-colors">
              Support
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
