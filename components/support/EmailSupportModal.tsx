"use client";

import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { Paperclip } from "lucide-react";
import SupportModal from "@/components/support/SupportModal";
import { submitEmailSupport } from "@/services/supportApi";
import { useToast } from "@/contexts/ToastContext";

const schema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Valid email required"),
  subject: z.string().min(3, "Subject is required"),
  message: z.string().min(10, "Message must be at least 10 characters"),
});

type FormValues = z.infer<typeof schema>;

type Props = {
  open: boolean;
  onClose: () => void;
  defaultName?: string;
  defaultEmail?: string;
  onSubmitted?: () => void;
  variant?: "modal" | "page";
};

export default function EmailSupportModal({
  open,
  onClose,
  defaultName = "",
  defaultEmail = "",
  onSubmitted,
  variant = "modal",
}: Props) {
  const { showToast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: defaultName,
      email: defaultEmail,
      subject: "",
      message: "",
    },
  });

  useEffect(() => {
    if (open) {
      reset({
        name: defaultName,
        email: defaultEmail,
        subject: "",
        message: "",
      });
    }
  }, [open, defaultName, defaultEmail, reset]);

  const onSubmit = async (values: FormValues) => {
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append("name", values.name);
      fd.append("email", values.email);
      fd.append("subject", values.subject);
      fd.append("message", values.message);
      if (file) fd.append("file", file);
      await submitEmailSupport(fd);
      showToast("Email Sent", "success");
      reset();
      setFile(null);
      onSubmitted?.();
      onClose();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "Failed to send email";
      showToast(msg, "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SupportModal open={open} onClose={onClose} title="Email Support" variant={variant}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {(
          [
            ["name", "Name", "text"],
            ["email", "Email", "email"],
            ["subject", "Subject", "text"],
          ] as const
        ).map(([key, label, type]) => (
          <div key={key}>
            <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-[#9CA3AF]">
              {label}
            </label>
            <input
              type={type}
              {...register(key)}
              className="w-full rounded-xl border border-border bg-white px-4 py-3 text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
            />
            {errors[key] ? (
              <p className="mt-1 text-sm font-bold text-red-500">{errors[key]?.message}</p>
            ) : null}
          </div>
        ))}

        <div>
          <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-[#9CA3AF]">
            Message
          </label>
          <textarea
            rows={5}
            {...register("message")}
            className="w-full rounded-xl border border-border bg-white px-4 py-3 text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
          />
          {errors.message ? (
            <p className="mt-1 text-sm font-bold text-red-500">{errors.message.message}</p>
          ) : null}
        </div>

        <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-border bg-white px-4 py-3 text-sm font-bold text-gray-text">
          <Paperclip className="h-4 w-4 text-primary" />
          {file ? file.name : "Attachment (optional)"}
          <input
            type="file"
            className="hidden"
            accept="image/jpeg,image/png,image/webp,application/pdf"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
          />
        </label>

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-xl bg-primary py-4 font-bold text-white hover:bg-primary-hover disabled:opacity-60"
        >
          {submitting ? "Sending…" : "Send Message"}
        </button>
      </form>
    </SupportModal>
  );
}
