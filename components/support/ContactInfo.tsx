"use client";

import { Phone, Mail, Globe, Clock } from "lucide-react";
import { useSiteSettings } from "@/contexts/SiteSettingsContext";

export default function ContactInfo() {
  const { settings } = useSiteSettings();

  return (
    <div className="bg-[#F8FAFC] rounded-3xl p-6 md:p-8 border border-[#E5E7EB] h-full">
      <h2 className="text-2xl font-bold text-[#1C1C1C] mb-8">Contact Information</h2>
      
      <div className="space-y-6 mb-10">
        
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-white rounded-xl border border-[#E5E7EB] flex items-center justify-center">
            <Phone className="w-5 h-5 text-[#6B7280]" />
          </div>
          <div>
            <p className="text-[#696969] text-xs font-bold uppercase tracking-widest mb-1">Phone</p>
            <p className="text-[#1C1C1C] font-bold">{settings.support_phone}</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-white rounded-xl border border-[#E5E7EB] flex items-center justify-center">
            <Mail className="w-5 h-5 text-[#6B7280]" />
          </div>
          <div>
            <p className="text-[#696969] text-xs font-bold uppercase tracking-widest mb-1">Email</p>
            <p className="text-[#1C1C1C] font-bold">{settings.support_email}</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-white rounded-xl border border-[#E5E7EB] flex items-center justify-center">
            <Globe className="w-5 h-5 text-[#6B7280]" />
          </div>
          <div>
            <p className="text-[#696969] text-xs font-bold uppercase tracking-widest mb-1">Website</p>
            <p className="text-[#1C1C1C] font-bold">{settings.website_url.replace(/^https?:\/\//, "")}</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-white rounded-xl border border-[#E5E7EB] flex items-center justify-center">
            <Clock className="w-5 h-5 text-[#6B7280]" />
          </div>
          <div>
            <p className="text-[#696969] text-xs font-bold uppercase tracking-widest mb-1">Working Hours</p>
            <p className="text-[#1C1C1C] font-bold">{settings.business_hours}</p>
          </div>
        </div>

      </div>

      <div className="pt-8 border-t border-[#E5E7EB]">
        <h3 className="text-[#1C1C1C] font-bold mb-4">Follow Us</h3>
        <div className="flex items-center gap-4">
          {settings.instagram_url ? (
            <a href={settings.instagram_url} target="_blank" rel="noopener noreferrer" className="w-12 h-12 rounded-full bg-white border border-[#E5E7EB] hover:border-[#E23744] flex items-center justify-center transition-colors hover:-translate-y-1">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#111827]"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>
            </a>
          ) : null}
          {settings.facebook_url ? (
            <a href={settings.facebook_url} target="_blank" rel="noopener noreferrer" className="w-12 h-12 rounded-full bg-white border border-[#E5E7EB] hover:border-[#E23744] flex items-center justify-center transition-colors hover:-translate-y-1">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#111827]"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
            </a>
          ) : null}
          {settings.twitter_url ? (
            <a href={settings.twitter_url} target="_blank" rel="noopener noreferrer" className="w-12 h-12 rounded-full bg-white border border-[#E5E7EB] hover:border-[#E23744] flex items-center justify-center transition-colors hover:-translate-y-1">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#111827]"><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"/></svg>
            </a>
          ) : null}
          {settings.linkedin_url ? (
            <a href={settings.linkedin_url} target="_blank" rel="noopener noreferrer" className="w-12 h-12 rounded-full bg-white border border-[#E5E7EB] hover:border-[#E23744] flex items-center justify-center transition-colors hover:-translate-y-1">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#111827]"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect width="4" height="12" x="2" y="9"/><circle cx="4" cy="4" r="2"/></svg>
            </a>
          ) : null}
        </div>
      </div>

    </div>
  );
}
