"use client";

import { MapPin, Phone, Mail, Clock, Globe } from "lucide-react";

export default function ContactInfo() {
  const infoCards = [
    { icon: MapPin, title: "Office Address", value: "123 Culinary Avenue, Tech Park, Hyderabad, India 500081" },
    { icon: Phone, title: "Phone", value: "+91 1800 123 4567" },
    { icon: Mail, title: "Email", value: "support@foodiq.com" },
    { icon: Clock, title: "Business Hours", value: "Mon - Sun: 24/7 Support" },
    { icon: Globe, title: "Website", value: "www.foodiq.com" }
  ];

  return (
    <div className="bg-[#F8FAFC] rounded-3xl p-8 md:p-10 border border-[#E5E7EB] shadow-2xl h-full flex flex-col justify-between">
      
      <div>
        <h2 className="text-2xl font-bold text-white mb-8">Contact Information</h2>
        
        <div className="space-y-6">
          {infoCards.map((info, idx) => (
            <div key={idx} className="flex items-start gap-5">
              <div className="w-12 h-12 bg-white rounded-xl border border-[#E5E7EB] flex items-center justify-center flex-shrink-0 mt-1">
                <info.icon className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-[#9CA3AF] text-xs font-bold uppercase tracking-widest mb-1">{info.title}</p>
                <p className="text-white font-bold leading-relaxed">{info.value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-12 pt-8 border-t border-[#E5E7EB]">
        <h3 className="text-white font-bold mb-6">Connect with us</h3>
        <div className="flex flex-wrap items-center gap-4">
          <a href="https://instagram.com/foodiq" target="_blank" rel="noopener noreferrer" className="w-12 h-12 rounded-full bg-white border border-[#E5E7EB] hover:border-primary hover:shadow-[0_0_15px_rgba(226, 55, 68,0.5)] flex items-center justify-center transition-all hover:scale-110">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#6B7280] hover:text-[#111827] transition-colors"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>
          </a>
          <a href="https://facebook.com/foodiq" target="_blank" rel="noopener noreferrer" className="w-12 h-12 rounded-full bg-white border border-[#E5E7EB] hover:border-blue-500 hover:shadow-[0_0_15px_rgba(59,130,246,0.5)] flex items-center justify-center transition-all hover:scale-110">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#6B7280] hover:text-[#111827] transition-colors"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
          </a>
          <a href="https://twitter.com/foodiq" target="_blank" rel="noopener noreferrer" className="w-12 h-12 rounded-full bg-white border border-[#E5E7EB] hover:border-blue-400 hover:shadow-[0_0_15px_rgba(96,165,250,0.5)] flex items-center justify-center transition-all hover:scale-110">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#6B7280] hover:text-[#111827] transition-colors"><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"/></svg>
          </a>
          <a href="https://linkedin.com/company/foodiq" target="_blank" rel="noopener noreferrer" className="w-12 h-12 rounded-full bg-white border border-[#E5E7EB] hover:border-blue-600 hover:shadow-[0_0_15px_rgba(37,99,235,0.5)] flex items-center justify-center transition-all hover:scale-110">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#6B7280] hover:text-[#111827] transition-colors"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect width="4" height="12" x="2" y="9"/><circle cx="4" cy="4" r="2"/></svg>
          </a>
          <a href="https://youtube.com/@foodiq" target="_blank" rel="noopener noreferrer" className="w-12 h-12 rounded-full bg-white border border-[#E5E7EB] hover:border-red-500 hover:shadow-[0_0_15px_rgba(239,68,68,0.5)] flex items-center justify-center transition-all hover:scale-110">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#6B7280] hover:text-[#111827] transition-colors"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z"/><polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"/></svg>
          </a>
        </div>
      </div>

    </div>
  );
}
