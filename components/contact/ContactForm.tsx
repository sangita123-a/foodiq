"use client";

import { Send, RefreshCcw } from "lucide-react";
import { FormEvent, useState } from "react";
import api from "@/services/api";
import { useToast } from "@/contexts/ToastContext";

export default function ContactForm() {
  const { showToast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const payload = {
      name: formData.get("name"),
      email: formData.get("email"),
      phone: formData.get("phone"),
      reason: formData.get("reason"),
      subject: formData.get("subject"),
      message: formData.get("message"),
    };

    try {
      setIsSubmitting(true);
      await api.post('/api/contact', payload);
      showToast("Message sent successfully. We will get back to you soon.", "success");
      (e.target as HTMLFormElement).reset();
    } catch (err: any) {
      console.error(err);
      showToast(err.response?.data?.message || "Failed to send message", "error");
    } finally {
      setIsSubmitting(false);
    }
  };
  return (
    <div className="bg-[#F8FAFC] rounded-3xl p-8 md:p-10 border border-[#E5E7EB] shadow-2xl h-full">
      <h2 className="text-2xl font-bold text-white mb-2">Send us a Message</h2>
      <p className="text-[#6B7280] text-sm mb-8">Fill out the form below and we'll get back to you as soon as possible.</p>

      <form onSubmit={handleSubmit} className="space-y-6">
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-bold text-[#6B7280] mb-2">Full Name</label>
            <input 
              type="text" 
              name="name"
              required
              placeholder="John Doe"
              className="w-full bg-white text-[#111827] border border-[#E5E7EB] rounded-xl px-4 py-3.5 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-[#6B7280] mb-2">Email Address</label>
            <input 
              type="email" 
              name="email"
              required
              placeholder="john@example.com"
              className="w-full bg-white text-[#111827] border border-[#E5E7EB] rounded-xl px-4 py-3.5 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-bold text-[#6B7280] mb-2">Phone Number</label>
            <input 
              type="tel" 
              name="phone"
              placeholder="+91 9876543210"
              className="w-full bg-white text-[#111827] border border-[#E5E7EB] rounded-xl px-4 py-3.5 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-[#6B7280] mb-2">Reason for Contact</label>
            <select name="reason" className="w-full bg-white text-[#111827] border border-[#E5E7EB] rounded-xl px-4 py-3.5 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors appearance-none cursor-pointer">
              <option>General Inquiry</option>
              <option>Order Support</option>
              <option>Partnership</option>
              <option>Business</option>
              <option>Feedback</option>
              <option>Technical Issue</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-bold text-[#6B7280] mb-2">Subject</label>
          <input 
            type="text" 
            name="subject"
            required
            placeholder="How can we help?"
            className="w-full bg-white text-[#111827] border border-[#E5E7EB] rounded-xl px-4 py-3.5 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-[#6B7280] mb-2">Message</label>
          <textarea 
            name="message"
            required
            rows={5}
            placeholder="Write your message here..."
            className="w-full bg-white text-[#111827] border border-[#E5E7EB] rounded-xl px-4 py-3.5 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors resize-none"
          ></textarea>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 pt-4">
          <button type="submit" disabled={isSubmitting} className="flex-1 bg-primary hover:bg-[#E76F0B] text-white px-6 py-4 rounded-xl font-black transition-colors shadow-xl flex items-center justify-center gap-2 disabled:opacity-50">
            {isSubmitting ? "Sending..." : "Send Message"} <Send className="w-4 h-4" />
          </button>
          <button type="reset" className="w-full sm:w-auto bg-white hover:bg-[#F8FAFC] border border-[#E5E7EB] text-white px-6 py-4 rounded-xl font-bold transition-colors flex items-center justify-center gap-2">
            Clear Form <RefreshCcw className="w-4 h-4 text-[#6B7280]" />
          </button>
        </div>

      </form>
    </div>
  );
}
