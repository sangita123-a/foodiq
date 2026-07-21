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
    <div className="h-full rounded-3xl border border-border bg-white p-8 shadow-sm md:p-10">
      <h2 className="mb-2 text-2xl font-bold text-foreground">Send us a Message</h2>
      <p className="mb-8 text-sm text-[#555555]">
        Fill out the form below and we&apos;ll get back to you as soon as possible.
      </p>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <Field label="Full Name" name="name" required placeholder="John Doe" />
          <Field label="Email Address" name="email" type="email" required placeholder="john@example.com" />
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <Field label="Phone Number" name="phone" type="tel" placeholder="+91 9876543210" />
          <div>
            <label className="mb-2 block text-sm font-bold text-[#555555]">Reason for Contact</label>
            <select
              name="reason"
              className="w-full cursor-pointer appearance-none rounded-xl border border-border bg-white px-4 py-3.5 text-foreground focus:border-primary focus:outline-none"
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
          <label className="mb-2 block text-sm font-bold text-[#555555]">Message</label>
          <textarea
            name="message"
            required
            rows={5}
            placeholder="Write your message here..."
            className="w-full resize-none rounded-xl border border-border bg-white px-4 py-3.5 text-foreground focus:border-primary focus:outline-none"
          />
        </div>

        <div className="flex flex-col gap-4 pt-4 sm:flex-row">
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-white shadow-[0_4px_12px_rgba(0,0,0,0.08)] transition hover:bg-primary-hover disabled:opacity-50"
          >
            {isSubmitting ? "Sending…" : "Send Message"} <Send className="h-4 w-4" />
          </button>
          <button
            type="reset"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-white px-6 py-2.5 text-sm font-semibold text-foreground transition hover:bg-section"
          >
            Clear Form <RefreshCcw className="h-4 w-4 text-[#555555]" />
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
      <label className="mb-2 block text-sm font-bold text-[#555555]">{label}</label>
      <input
        type={type}
        name={name}
        required={required}
        placeholder={placeholder}
        className="w-full rounded-xl border border-border bg-white px-4 py-3.5 text-foreground placeholder:text-[#888888] focus:border-primary focus:outline-none"
      />
    </div>
  );
}
