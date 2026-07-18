"use client";

import { Send } from "lucide-react";
import { FormEvent, useState } from "react";
import api from "@/services/api";
import { useToast } from "@/contexts/ToastContext";

type Mode = "support" | "bug" | "feedback";

export default function SupportTicketForm() {
  const { showToast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mode, setMode] = useState<Mode>("support");

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);

    try {
      setIsSubmitting(true);
      if (mode === "bug") {
        await api.post("/api/bugs", {
          title: formData.get("subject"),
          description: formData.get("description"),
          severity: formData.get("severity") || "medium",
          page_url:
            typeof window !== "undefined" ? window.location.href : undefined,
        });
        showToast("Bug report submitted. Our team will investigate.", "success");
      } else if (mode === "feedback") {
        await api.post("/api/feedback", {
          category: formData.get("category") || "general",
          message: formData.get("description"),
          page_url:
            typeof window !== "undefined" ? window.location.href : undefined,
        });
        showToast("Thanks for your feedback!", "success");
      } else {
        await api.post("/api/support", {
          category: formData.get("category"),
          subject: formData.get("subject"),
          description: formData.get("description"),
        });
        showToast(
          "Support ticket submitted successfully. We will get back to you soon.",
          "success"
        );
      }
      form.reset();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Failed to submit";
      showToast(msg, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-[#F8FAFC] rounded-3xl p-6 md:p-8 border border-[#E5E7EB] h-full">
      <h2 className="text-2xl font-bold text-[#111827] mb-2">Get help</h2>
      <p className="text-[#6B7280] text-sm mb-6">
        Submit a support ticket, report a bug, or share product feedback.
      </p>

      <div className="flex flex-wrap gap-2 mb-6">
        {(
          [
            ["support", "Support ticket"],
            ["bug", "Report a bug"],
            ["feedback", "Product feedback"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setMode(key)}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors ${
              mode === key
                ? "bg-[#FC8019] text-white"
                : "bg-white border border-[#E5E7EB] text-[#6B7280] hover:text-[#111827]"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {mode !== "feedback" && (
          <div>
            <label className="block text-sm font-bold text-[#6B7280] mb-2">
              {mode === "bug" ? "Title" : "Subject"}
            </label>
            <input
              type="text"
              name="subject"
              required
              placeholder={
                mode === "bug"
                  ? "Short bug title…"
                  : "Briefly describe the issue…"
              }
              className="w-full bg-white text-[#111827] border border-[#E5E7EB] rounded-xl px-4 py-3.5 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
            />
          </div>
        )}

        {mode === "support" && (
          <div>
            <label className="block text-sm font-bold text-[#6B7280] mb-2">
              Category
            </label>
            <select
              name="category"
              required
              className="w-full bg-white text-[#111827] border border-[#E5E7EB] rounded-xl px-4 py-3.5 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors appearance-none cursor-pointer"
            >
              <option>Order Issue</option>
              <option>Payment / Refund</option>
              <option>Account Management</option>
              <option>Feedback / Suggestion</option>
              <option>Other</option>
            </select>
          </div>
        )}

        {mode === "feedback" && (
          <div>
            <label className="block text-sm font-bold text-[#6B7280] mb-2">
              Category
            </label>
            <select
              name="category"
              className="w-full bg-white text-[#111827] border border-[#E5E7EB] rounded-xl px-4 py-3.5 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors appearance-none cursor-pointer"
            >
              <option value="general">General</option>
              <option value="feature">Feature idea</option>
              <option value="ux">App experience</option>
              <option value="other">Other</option>
            </select>
          </div>
        )}

        {mode === "bug" && (
          <div>
            <label className="block text-sm font-bold text-[#6B7280] mb-2">
              Severity
            </label>
            <select
              name="severity"
              className="w-full bg-white text-[#111827] border border-[#E5E7EB] rounded-xl px-4 py-3.5 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors appearance-none cursor-pointer"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </div>
        )}

        <div>
          <label className="block text-sm font-bold text-[#6B7280] mb-2">
            Description
          </label>
          <textarea
            name="description"
            required
            rows={4}
            placeholder="Please provide as much detail as possible…"
            className="w-full bg-white text-[#111827] border border-[#E5E7EB] rounded-xl px-4 py-3.5 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors resize-none"
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-[#FC8019] hover:bg-[#E76F0B] disabled:opacity-60 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-colors"
        >
          <Send className="w-4 h-4" />
          {isSubmitting ? "Submitting…" : "Submit"}
        </button>
      </form>
    </div>
  );
}
