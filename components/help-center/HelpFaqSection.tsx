"use client";

import { useState } from "react";
import { ChevronDown, Search } from "lucide-react";
import { HELP_FAQ_SECTIONS } from "@/services/helpCenterApi";

export default function HelpFaqSection() {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState<string | null>("order");

  const filtered = HELP_FAQ_SECTIONS.map((section) => ({
    ...section,
    items: section.items.filter(
      (item) =>
        !search ||
        item.q.toLowerCase().includes(search.toLowerCase()) ||
        item.a.toLowerCase().includes(search.toLowerCase())
    ),
  })).filter((s) => s.items.length > 0);

  return (
    <div>
      <div className="relative mb-6">
        <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search FAQs…"
          className="w-full border border-border rounded-2xl pl-11 pr-4 py-3 text-sm bg-white"
        />
      </div>

      <div className="space-y-3">
        {filtered.map((section) => (
          <div key={section.id} className="bg-white rounded-2xl border border-border overflow-hidden">
            <button
              type="button"
              onClick={() => setOpen(open === section.id ? null : section.id)}
              className="w-full flex items-center justify-between px-5 py-4 text-left font-black text-foreground"
            >
              {section.title}
              <ChevronDown className={`w-5 h-5 transition ${open === section.id ? "rotate-180" : ""}`} />
            </button>
            {open === section.id && (
              <div className="px-5 pb-4 space-y-3 border-t border-border pt-3">
                {section.items.map((item, i) => (
                  <div key={i}>
                    <p className="font-bold text-sm text-foreground mb-1">{item.q}</p>
                    <p className="text-sm text-gray-text">{item.a}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
