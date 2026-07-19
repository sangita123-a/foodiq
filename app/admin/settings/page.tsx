"use client";

import { useEffect, useState } from "react";
import { mutate } from "swr";
import AdminShell from "@/components/admin/AdminShell";
import { useAdminList } from "@/hooks/useAdminData";
import { adminPut } from "@/services/adminApi";

type Settings = {
  delivery_charge: number;
  free_delivery_min: number;
  tax_percent: number;
  commission_percent: number;
  app_name: string;
  support_email: string;
  support_phone: string;
  payment_cod_enabled: boolean;
  payment_upi_enabled: boolean;
  payment_card_enabled: boolean;
  payment_razorpay_enabled: boolean;
};

export default function AdminSettingsPage() {
  const { data } = useAdminList<Settings>("/api/admin/settings");
  const [form, setForm] = useState<Settings | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (data) setForm(data);
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

  if (!form) {
    return (
      <AdminShell title="Settings">
        <p className="text-[#6B7280]">Loading settings…</p>
      </AdminShell>
    );
  }

  return (
    <AdminShell title="Platform Settings">
      <div className="mb-6">
        <h1 className="text-3xl font-black text-[#111827]">Settings</h1>
        <p className="text-[#6B7280]">Delivery charges, taxes, commission, and payments.</p>
      </div>

      <form onSubmit={save} className="bg-white rounded-3xl border border-[#E5E7EB] p-6 max-w-3xl space-y-6">
        <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <h2 className="md:col-span-2 font-bold text-lg">App</h2>
          <input value={form.app_name || ""} onChange={(e) => setForm({ ...form, app_name: e.target.value })} placeholder="App name" className="border border-[#E5E7EB] rounded-xl px-4 py-3 text-sm" />
          <input value={form.support_email || ""} onChange={(e) => setForm({ ...form, support_email: e.target.value })} placeholder="Support email" className="border border-[#E5E7EB] rounded-xl px-4 py-3 text-sm" />
          <input value={form.support_phone || ""} onChange={(e) => setForm({ ...form, support_phone: e.target.value })} placeholder="Support phone" className="border border-[#E5E7EB] rounded-xl px-4 py-3 text-sm md:col-span-2" />
        </section>

        <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <h2 className="md:col-span-2 font-bold text-lg">Fees & Commission</h2>
          <label className="text-sm font-bold text-[#6B7280]">Delivery charge (₹)
            <input type="number" value={form.delivery_charge} onChange={(e) => setForm({ ...form, delivery_charge: Number(e.target.value) })} className="mt-1 w-full border border-[#E5E7EB] rounded-xl px-4 py-3 text-sm font-normal text-[#111827]" />
          </label>
          <label className="text-sm font-bold text-[#6B7280]">Free delivery min (₹)
            <input type="number" value={form.free_delivery_min} onChange={(e) => setForm({ ...form, free_delivery_min: Number(e.target.value) })} className="mt-1 w-full border border-[#E5E7EB] rounded-xl px-4 py-3 text-sm font-normal text-[#111827]" />
          </label>
          <label className="text-sm font-bold text-[#6B7280]">Tax %
            <input type="number" step="0.1" value={form.tax_percent} onChange={(e) => setForm({ ...form, tax_percent: Number(e.target.value) })} className="mt-1 w-full border border-[#E5E7EB] rounded-xl px-4 py-3 text-sm font-normal text-[#111827]" />
          </label>
          <label className="text-sm font-bold text-[#6B7280]">Commission %
            <input type="number" step="0.1" value={form.commission_percent} onChange={(e) => setForm({ ...form, commission_percent: Number(e.target.value) })} className="mt-1 w-full border border-[#E5E7EB] rounded-xl px-4 py-3 text-sm font-normal text-[#111827]" />
          </label>
        </section>

        <section className="space-y-3">
          <h2 className="font-bold text-lg">Payment methods</h2>
          {([
            ["payment_cod_enabled", "Cash on Delivery"],
            ["payment_upi_enabled", "UPI"],
            ["payment_card_enabled", "Cards"],
            ["payment_razorpay_enabled", "Razorpay"],
          ] as const).map(([key, label]) => (
            <label key={key} className="flex items-center gap-3 text-sm font-bold text-[#6B7280]">
              <input
                type="checkbox"
                checked={Boolean(form[key])}
                onChange={(e) => setForm({ ...form, [key]: e.target.checked })}
              />
              {label}
            </label>
          ))}
        </section>

        <button type="submit" disabled={saving} className="bg-[#E23744] text-white font-black px-8 py-3 rounded-xl disabled:opacity-60">
          {saving ? "Saving…" : "Save Settings"}
        </button>
        {saved && <p className="text-sm font-bold text-green-600">Settings saved.</p>}
      </form>
    </AdminShell>
  );
}
