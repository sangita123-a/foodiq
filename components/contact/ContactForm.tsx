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
      await api.post("/api/contact", payload);
      showToast("Message sent successfully! We will get back to you soon.", "success");
      (e.target as HTMLFormElement).reset();
    } catch (err: unknown) {
      const message =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined;
      showToast(message || "Failed to send message", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="h-full rounded-2xl border border-border bg-white p-3 shadow-sm max-md:rounded-lg max-md:p-3 md:rounded-3xl md:p-10">
      <h2 className="mb-0.5 text-sm font-bold text-foreground max-md:text-sm md:mb-2 md:text-2xl">Send us a Message</h2>
      <p className="mb-2.5 text-[10px] leading-snug text-[#555555] max-md:mb-2.5 max-md:line-clamp-1 md:mb-8 md:text-sm">
        Fill out the form below and we&apos;ll get back to you as soon as possible.
      </p>

      <form onSubmit={handleSubmit} className="space-y-2 max-md:space-y-2 md:space-y-6">
        <div className="grid grid-cols-1 gap-2 max-md:gap-2 md:grid-cols-2 md:gap-6">
          <Field label="Full Name" name="name" required placeholder="John Doe" />
          <Field label="Email Address" name="email" type="email" required placeholder="john@example.com" />
        </div>

        <div className="grid grid-cols-1 gap-2 max-md:gap-2 md:grid-cols-2 md:gap-6">
          <Field label="Phone Number" name="phone" type="tel" placeholder="+91 9876543210" />
          <div>
            <label className="mb-0.5 block text-[10px] font-bold text-[#555555] max-md:mb-0.5 md:mb-2 md:text-sm">Reason for Contact</label>
            <select
              name="reason"
              className="w-full cursor-pointer appearance-none rounded-lg border border-border bg-white px-3 text-foreground focus:border-primary focus:outline-none max-md:h-[42px] max-md:rounded-lg max-md:py-0 md:rounded-xl md:px-4 md:py-3.5"
            >
              <option>General Inquiry</option>
              <option>Order Support</option>
              <option>Partnership</option>
              <option>Business</option>
              <option>Feedback</option>
              <option>Technical Issue</option>
            </select>
          </div>
        </div>

        <Field label="Subject" name="subject" required placeholder="How can we help?" />
        <div>
          <label className="mb-0.5 block text-[10px] font-bold text-[#555555] max-md:mb-0.5 md:mb-2 md:text-sm">Message</label>
          <textarea
            name="message"
            required
            rows={4}
            placeholder="Write your message here..."
            className="w-full resize-none rounded-lg border border-border bg-white px-3 text-foreground focus:border-primary focus:outline-none max-md:min-h-[96px] max-md:rounded-lg max-md:py-2 md:rounded-xl md:px-4 md:py-3.5 md:rows-5"
          />
        </div>

        <div className="flex flex-col gap-1.5 pt-1 max-md:gap-1.5 max-md:pt-1 sm:flex-row md:gap-4 md:pt-4">
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-primary px-4 text-xs font-semibold text-white shadow-[0_4px_12px_rgba(0,0,0,0.08)] transition hover:bg-primary-hover disabled:opacity-50 max-md:h-[42px] max-md:py-0 max-md:text-xs md:gap-2 md:rounded-xl md:px-6 md:py-2.5 md:text-sm"
          >
            {isSubmitting ? "Sending…" : "Send Message"} <Send className="h-3.5 w-3.5 md:h-4 md:w-4" />
          </button>
          <button
            type="reset"
            className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-border bg-white px-4 text-xs font-semibold text-foreground transition hover:bg-section max-md:h-[42px] max-md:py-0 max-md:text-xs md:gap-2 md:rounded-xl md:px-6 md:py-2.5 md:text-sm"
          >
            Clear Form <RefreshCcw className="h-3.5 w-3.5 text-[#555555] md:h-4 md:w-4" />
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({
  label,
  name,
  type = "text",
  required,
  placeholder,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="mb-0.5 block text-[10px] font-bold text-[#555555] max-md:mb-0.5 md:mb-2 md:text-sm">{label}</label>
      <input
        type={type}
        name={name}
        required={required}
        placeholder={placeholder}
        className="w-full rounded-lg border border-border bg-white px-3 text-foreground placeholder:text-[#888888] focus:border-primary focus:outline-none max-md:h-[42px] max-md:rounded-lg max-md:py-0 md:rounded-xl md:px-4 md:py-3.5"
      />
    </div>
  );
}
