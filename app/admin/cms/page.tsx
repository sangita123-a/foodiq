"use client";

import { useState } from "react";
import { mutate } from "swr";
import AdminShell from "@/components/admin/AdminShell";
import { useAdminList } from "@/hooks/useAdminData";
import { adminPut, adminDelete } from "@/services/adminApi";

type CmsItem = {
  id: string;
  content_key: string;
  content_type: string;
  title?: string;
  body: Record<string, unknown>;
  is_active?: boolean;
  sort_order?: number;
};

const PRESET_KEYS = [
  { key: "homepage_banner", type: "banner", label: "Homepage Banner" },
  { key: "featured_collections", type: "collection", label: "Featured Collections" },
  { key: "homepage_offers", type: "offers", label: "Homepage Offers" },
  { key: "homepage_promotions", type: "promotion", label: "Homepage Promotions" },
  { key: "categories", type: "categories", label: "Categories" },
  { key: "faqs", type: "faq", label: "FAQs" },
  { key: "terms", type: "legal", label: "Terms of Service" },
  { key: "privacy", type: "legal", label: "Privacy Policy" },
  { key: "about", type: "page", label: "About Us" },
  { key: "contact", type: "page", label: "Contact" },
];

export default function AdminCmsPage() {
  const { data, isLoading } = useAdminList<CmsItem[]>("/api/admin/cms");
  const items = data || [];
  const [selected, setSelected] = useState(PRESET_KEYS[0]);
  const [title, setTitle] = useState("");
  const [bodyJson, setBodyJson] = useState("{}");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  const loadPreset = (preset: (typeof PRESET_KEYS)[0]) => {
    setSelected(preset);
    const existing = items.find((i) => i.content_key === preset.key);
    setTitle(existing?.title || preset.label);
    setBodyJson(JSON.stringify(existing?.body || { content: "" }, null, 2));
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setMsg("");
    try {
      const body = JSON.parse(bodyJson);
      await adminPut("/api/admin/cms", {
        content_key: selected.key,
        content_type: selected.type,
        title,
        body,
        is_active: true,
      });
      mutate("/api/admin/cms");
      setMsg("Content saved successfully.");
    } catch {
      setMsg("Invalid JSON or save failed.");
    } finally {
      setBusy(false);
    }
  };

  const remove = async (key: string) => {
    if (!confirm("Delete this CMS block?")) return;
    await adminDelete(`/api/admin/cms/${key}`);
    mutate("/api/admin/cms");
  };

  return (
    <AdminShell title="CMS">
      <div className="mb-6">
        <h1 className="text-3xl font-black text-[#111827]">Content Management</h1>
        <p className="text-[#6B7280]">Manage homepage banners, collections, offers, legal pages, and FAQs.</p>
      </div>

      {msg && (
        <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {msg}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-3xl border border-[#E5E7EB] p-4">
          <h2 className="text-sm font-black uppercase tracking-widest text-[#9CA3AF] mb-3 px-2">Pages</h2>
          <div className="space-y-1">
            {PRESET_KEYS.map((p) => (
              <button
                key={p.key}
                type="button"
                onClick={() => loadPreset(p)}
                className={`w-full text-left px-3 py-2.5 rounded-xl text-sm font-bold transition ${
                  selected.key === p.key
                    ? "bg-[#E23744] text-white"
                    : "text-[#6B7280] hover:bg-[#F8FAFC]"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={save} className="lg:col-span-3 bg-white rounded-3xl border border-[#E5E7EB] p-6 space-y-4">
          <h2 className="text-lg font-black text-[#111827]">{selected.label}</h2>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title"
            className="w-full border border-[#E5E7EB] rounded-xl px-4 py-3 text-sm"
          />
          <textarea
            value={bodyJson}
            onChange={(e) => setBodyJson(e.target.value)}
            rows={14}
            className="w-full border border-[#E5E7EB] rounded-xl px-4 py-3 text-sm font-mono"
            placeholder='{"content": "..."}'
          />
          <div className="flex gap-3">
            <button type="submit" disabled={busy} className="bg-[#E23744] text-white font-black px-6 py-3 rounded-xl">
              Save Content
            </button>
          </div>
        </form>
      </div>

      {isLoading ? null : items.length > 0 && (
        <div className="mt-8 bg-white rounded-3xl border border-[#E5E7EB] p-6">
          <h2 className="text-lg font-black text-[#111827] mb-4">Published Blocks</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {items.map((item) => (
              <div key={item.id} className="border border-[#E5E7EB] rounded-xl p-4 flex justify-between items-start">
                <div>
                  <p className="font-bold text-[#111827]">{item.title || item.content_key}</p>
                  <p className="text-xs text-[#9CA3AF]">{item.content_key} · {item.content_type}</p>
                </div>
                <button type="button" onClick={() => remove(item.content_key)} className="text-xs text-red-500 font-bold">
                  Delete
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </AdminShell>
  );
}
