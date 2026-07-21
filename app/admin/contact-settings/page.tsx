"use client";

import { useEffect, useState } from "react";
import { mutate } from "swr";
import AdminShell from "@/components/admin/AdminShell";
import { adminPut } from "@/services/adminApi";
import {
  CONTACT_INFO_SWR_KEY,
  validateContactInfoForm,
  type ContactInfo,
} from "@/lib/contactInfo";
import { useContactInfo } from "@/hooks/useContactInfo";

export default function AdminContactSettingsPage() {
  const { contact, isLoading } = useContactInfo();
  const [form, setForm] = useState<ContactInfo | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (contact) setForm(contact);
  }, [contact]);

  const set = <K extends keyof ContactInfo>(key: K, value: ContactInfo[K]) => {
    setForm((prev) => (prev ? { ...prev, [key]: value } : prev));
    setSaved(false);
    setError(null);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form) return;

    const validationErrors = validateContactInfoForm(form);
    if (validationErrors.length > 0) {
      setError(validationErrors[0]);
      setSaved(false);
      return;
    }

    setSaving(true);
    setSaved(false);
    setError(null);

    try {
      await adminPut<ContactInfo>("/api/admin/contact", form as unknown as Record<string, unknown>);
      await mutate(CONTACT_INFO_SWR_KEY);
      await mutate("site-settings");
      setSaved(true);
    } catch (err: unknown) {
      const message =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined;
      setError(message || "Failed to save contact information. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (isLoading || !form) {
    return (
      <AdminShell title="Contact Settings">
        <p className="text-[#555555]">Loading contact settings…</p>
      </AdminShell>
    );
  }

  return (
    <AdminShell title="Contact Settings">
      <div className="mb-6">
        <h1 className="text-3xl font-black text-[#222222]">Contact Settings</h1>
        <p className="text-[#555555]">
          Manage the contact information shown on the Contact Us page. Changes appear instantly for all visitors.
        </p>
      </div>

      <form onSubmit={save} className="max-w-4xl space-y-6 rounded-3xl border border-[#E5E7EB] bg-white p-6">
        <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Input
            label="Phone Number"
            value={form.phone_number}
            onChange={(v) => set("phone_number", v)}
          />
          <Input label="Email Address" value={form.email} onChange={(v) => set("email", v)} />
          <Input
            label="WhatsApp Number"
            value={form.whatsapp_number}
            onChange={(v) => set("whatsapp_number", v)}
          />
          <Input
            label="Business Hours"
            value={form.business_hours}
            onChange={(v) => set("business_hours", v)}
          />
          <Input
            label="Website"
            value={form.website}
            onChange={(v) => set("website", v)}
            className="md:col-span-2"
          />
          <TextArea
            label="Office Address"
            value={form.office_address}
            onChange={(v) => set("office_address", v)}
            rows={3}
            className="md:col-span-2"
          />
        </section>

        <button
          type="submit"
          disabled={saving}
          className="rounded-xl bg-[#E23744] px-8 py-3 font-black text-white disabled:opacity-60"
        >
          {saving ? "Saving…" : "Save Changes"}
        </button>

        {saved && (
          <p className="text-sm font-bold text-green-600">
            Contact information saved — changes are live on the Contact Us page.
          </p>
        )}
        {error && <p className="text-sm font-bold text-red-600">{error}</p>}
      </form>
    </AdminShell>
  );
}

function Input({
  label,
  value,
  onChange,
  className = "",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  className?: string;
}) {
  return (
    <label className={`block text-sm font-bold text-[#555555] ${className}`}>
      {label}
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required
        className="mt-1 w-full rounded-xl border border-[#E5E7EB] px-4 py-3 text-sm font-normal text-[#222222]"
      />
    </label>
  );
}

function TextArea({
  label,
  value,
  onChange,
  rows = 4,
  className = "",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  rows?: number;
  className?: string;
}) {
  return (
    <label className={`block text-sm font-bold text-[#555555] ${className}`}>
      {label}
      <textarea
        value={value}
        rows={rows}
        onChange={(e) => onChange(e.target.value)}
        required
        className="mt-1 w-full resize-y rounded-xl border border-[#E5E7EB] px-4 py-3 text-sm font-normal text-[#222222]"
      />
    </label>
  );
}
