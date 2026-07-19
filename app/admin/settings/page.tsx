"use client";

import { useEffect, useState } from "react";
import { mutate } from "swr";
import AdminShell from "@/components/admin/AdminShell";
import { useAdminList } from "@/hooks/useAdminData";
import { adminPut } from "@/services/adminApi";
import MediaUploader from "@/components/media/MediaUploader";
import type { MediaAsset } from "@/services/mediaApi";

type Settings = {
  delivery_charge: number;
  free_delivery_min: number;
  tax_percent: number;
  commission_percent: number;
  app_name: string;
  company_name: string;
  support_email: string;
  support_phone: string;
  whatsapp_number: string;
  office_address: string;
  google_maps_embed_url: string;
  business_hours: string;
  website_url: string;
  logo_url: string;
  theme_color: string;
  footer_content: string;
  privacy_policy_text: string;
  terms_of_service_text: string;
  facebook_url: string;
  instagram_url: string;
  twitter_url: string;
  linkedin_url: string;
  youtube_url: string;
  payment_cod_enabled: boolean;
  payment_upi_enabled: boolean;
  payment_card_enabled: boolean;
  payment_razorpay_enabled: boolean;
};

type Tab = "general" | "contact" | "branding" | "social" | "legal" | "payments";

export default function AdminSettingsPage() {
  const { data } = useAdminList<Settings>("/api/admin/settings");
  const [form, setForm] = useState<Settings | null>(null);
  const [tab, setTab] = useState<Tab>("general");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (data) setForm(data as Settings);
  }, [data]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form) return;
    setSaving(true);
    setSaved(false);
    try {
      await adminPut("/api/admin/settings", form as unknown as Record<string, unknown>);
      mutate("/api/admin/settings");
      setSaved(true);
    } finally {
      setSaving(false);
    }
  };

  const set = <K extends keyof Settings>(key: K, value: Settings[K]) => {
    setForm((prev) => (prev ? { ...prev, [key]: value } : prev));
  };

  if (!form) {
    return (
      <AdminShell title="Settings">
        <p className="text-[#555555]">Loading settings…</p>
      </AdminShell>
    );
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: "general", label: "General" },
    { id: "contact", label: "Contact" },
    { id: "branding", label: "Branding" },
    { id: "social", label: "Social" },
    { id: "legal", label: "Legal" },
    { id: "payments", label: "Payments" },
  ];

  return (
    <AdminShell title="Platform Settings">
      <div className="mb-6">
        <h1 className="text-3xl font-black text-[#222222]">Admin Settings</h1>
        <p className="text-[#555555]">
          Changes apply across the website — contact page, footer, theme, and checkout fees.
        </p>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`rounded-xl px-4 py-2 text-sm font-bold ${
              tab === t.id ? "bg-[#E23744] text-white" : "border border-[#E5E7EB] bg-white text-[#555555]"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <form onSubmit={save} className="max-w-4xl space-y-6 rounded-3xl border border-[#E5E7EB] bg-white p-6">
        {tab === "general" && (
          <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Input label="Website Name" value={form.app_name || ""} onChange={(v) => set("app_name", v)} />
            <Input label="Company Name" value={form.company_name || ""} onChange={(v) => set("company_name", v)} />
            <Input label="Website URL" value={form.website_url || ""} onChange={(v) => set("website_url", v)} className="md:col-span-2" />
            <TextArea label="Footer Content" value={form.footer_content || ""} onChange={(v) => set("footer_content", v)} rows={3} className="md:col-span-2" />
          </section>
        )}

        {tab === "contact" && (
          <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Input label="Support Email" value={form.support_email || ""} onChange={(v) => set("support_email", v)} />
            <Input label="Contact Number" value={form.support_phone || ""} onChange={(v) => set("support_phone", v)} />
            <Input label="WhatsApp Number" value={form.whatsapp_number || ""} onChange={(v) => set("whatsapp_number", v)} />
            <Input label="Business Hours" value={form.business_hours || ""} onChange={(v) => set("business_hours", v)} />
            <TextArea label="Office Address" value={form.office_address || ""} onChange={(v) => set("office_address", v)} rows={3} className="md:col-span-2" />
            <TextArea label="Google Maps Embed URL" value={form.google_maps_embed_url || ""} onChange={(v) => set("google_maps_embed_url", v)} rows={2} className="md:col-span-2" />
          </section>
        )}

        {tab === "branding" && (
          <section className="space-y-6">
            <div>
              <label className="mb-2 block text-sm font-bold text-[#555555]">Logo</label>
              <MediaUploader
                purpose="site_logo"
                value={form.logo_url || null}
                aspect="wide"
                label="Site Logo"
                onUploaded={(asset: MediaAsset) => set("logo_url", asset.url)}
                onClear={() => set("logo_url", "")}
              />
            </div>
            <Input label="Theme Color" value={form.theme_color || "#E23744"} onChange={(v) => set("theme_color", v)} />
          </section>
        )}

        {tab === "social" && (
          <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Input label="Facebook" value={form.facebook_url || ""} onChange={(v) => set("facebook_url", v)} />
            <Input label="Instagram" value={form.instagram_url || ""} onChange={(v) => set("instagram_url", v)} />
            <Input label="Twitter / X" value={form.twitter_url || ""} onChange={(v) => set("twitter_url", v)} />
            <Input label="LinkedIn" value={form.linkedin_url || ""} onChange={(v) => set("linkedin_url", v)} />
            <Input label="YouTube" value={form.youtube_url || ""} onChange={(v) => set("youtube_url", v)} className="md:col-span-2" />
          </section>
        )}

        {tab === "legal" && (
          <section className="space-y-4">
            <TextArea label="Privacy Policy" value={form.privacy_policy_text || ""} onChange={(v) => set("privacy_policy_text", v)} rows={8} />
            <TextArea label="Terms of Service" value={form.terms_of_service_text || ""} onChange={(v) => set("terms_of_service_text", v)} rows={8} />
          </section>
        )}

        {tab === "payments" && (
          <section className="space-y-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <NumberInput label="Delivery charge (₹)" value={form.delivery_charge} onChange={(v) => set("delivery_charge", v)} />
              <NumberInput label="Free delivery min (₹)" value={form.free_delivery_min} onChange={(v) => set("free_delivery_min", v)} />
              <NumberInput label="Tax %" value={form.tax_percent} step={0.1} onChange={(v) => set("tax_percent", v)} />
              <NumberInput label="Commission %" value={form.commission_percent} step={0.1} onChange={(v) => set("commission_percent", v)} />
            </div>
            <div className="space-y-3">
              {([
                ["payment_cod_enabled", "Cash on Delivery"],
                ["payment_upi_enabled", "UPI"],
                ["payment_card_enabled", "Cards"],
                ["payment_razorpay_enabled", "Razorpay"],
              ] as const).map(([key, label]) => (
                <label key={key} className="flex items-center gap-3 text-sm font-bold text-[#555555]">
                  <input
                    type="checkbox"
                    checked={Boolean(form[key])}
                    onChange={(e) => set(key, e.target.checked)}
                  />
                  {label}
                </label>
              ))}
            </div>
          </section>
        )}

        <button type="submit" disabled={saving} className="rounded-xl bg-[#E23744] px-8 py-3 font-black text-white disabled:opacity-60">
          {saving ? "Saving…" : "Save Settings"}
        </button>
        {saved && <p className="text-sm font-bold text-green-600">Settings saved — changes reflect site-wide.</p>}
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
        className="mt-1 w-full rounded-xl border border-[#E5E7EB] px-4 py-3 text-sm font-normal text-[#222222]"
      />
    </label>
  );
}

function NumberInput({
  label,
  value,
  onChange,
  step = 1,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  step?: number;
}) {
  return (
    <label className="block text-sm font-bold text-[#555555]">
      {label}
      <input
        type="number"
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
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
        className="mt-1 w-full resize-y rounded-xl border border-[#E5E7EB] px-4 py-3 text-sm font-normal text-[#222222]"
      />
    </label>
  );
}
