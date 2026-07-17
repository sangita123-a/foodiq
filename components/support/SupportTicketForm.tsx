"use client";

import { Send, Paperclip } from "lucide-react";
import { FormEvent, useState } from "react";
import api from "@/services/api";
import { useToast } from "@/contexts/ToastContext";

export default function SupportTicketForm() {
  const { showToast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const payload = {
      category: formData.get("category"),
      subject: formData.get("subject"),
      description: formData.get("description"),
    };

    try {
      setIsSubmitting(true);
      await api.post('/api/support', payload);
      showToast("Support ticket submitted successfully. We will get back to you soon.", "success");
      (e.target as HTMLFormElement).reset();
    } catch (err: any) {
      console.error(err);
      showToast(err.response?.data?.message || "Failed to submit ticket", "error");
    } finally {
      setIsSubmitting(false);
    }
  };
  return (
    <div className="bg-[#F8FAFC] rounded-3xl p-6 md:p-8 border border-[#E5E7EB] h-full">
      <h2 className="text-2xl font-bold text-white mb-2">Submit a Ticket</h2>
      <p className="text-[#6B7280] text-sm mb-8">For complex issues, open a support ticket. We usually respond within 24 hours.</p>

      <form onSubmit={handleSubmit} className="space-y-6">
        
        <div>
          <label className="block text-sm font-bold text-[#6B7280] mb-2">Category</label>
          <select name="category" required className="w-full bg-white text-[#111827] border border-[#E5E7EB] rounded-xl px-4 py-3.5 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors appearance-none cursor-pointer">
            <option>Order Issue</option>
            <option>Payment / Refund</option>
            <option>Account Management</option>
            <option>Feedback / Suggestion</option>
            <option>Other</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-bold text-[#6B7280] mb-2">Subject</label>
          <input 
            type="text" 
            name="subject"
            required
            placeholder="Briefly describe the issue..."
            className="w-full bg-white text-[#111827] border border-[#E5E7EB] rounded-xl px-4 py-3.5 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-[#6B7280] mb-2">Description</label>
          <textarea 
            name="description"
            required
            rows={4}
            placeholder="Please provide as much detail as possible..."
            className="w-full bg-white text-[#111827] border border-[#E5E7EB] rounded-xl px-4 py-3.5 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors resize-none"
          ></textarea>
        </div>

        <div>
          <label className="block text-sm font-bold text-[#6B7280] mb-2">Attachments (Optional)</label>
          <div className="w-full bg-white border-2 border-dashed border-[#E5E7EB] rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 transition-colors group">
            <Paperclip className="w-6 h-6 text-[#9CA3AF] mb-2 group-hover:text-primary transition-colors" />
            <p className="text-white text-sm font-bold">Click to upload screenshot</p>
            <p className="text-[#9CA3AF] text-xs mt-1">PNG, JPG up to 5MB</p>
          </div>
        </div>

        <button type="submit" disabled={isSubmitting} className="w-full bg-white text-black hover:bg-gray-200 px-6 py-4 rounded-xl font-black transition-colors shadow-xl flex items-center justify-center gap-2 disabled:opacity-50">
          {isSubmitting ? "Submitting..." : "Submit Ticket"} <Send className="w-4 h-4" />
        </button>

      </form>
    </div>
  );
}
