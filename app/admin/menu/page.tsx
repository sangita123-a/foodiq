"use client";

import { useMemo, useState } from "react";
import { mutate } from "swr";
import AdminShell from "@/components/admin/AdminShell";
import { useAdminList } from "@/hooks/useAdminData";
import { adminDelete, formatCurrency } from "@/services/adminApi";
import SafeImage from "@/components/ui/SafeImage";
import { FOOD_FALLBACK } from "@/lib/images";

type MenuItem = {
  id: string;
  name: string;
  price: number;
  image_url?: string;
  restaurant_name?: string;
  category_name?: string;
  is_available?: boolean;
  is_vegetarian?: boolean;
};

type Category = {
  id: string;
  name: string;
  restaurant_count?: number;
};

export default function AdminMenuPage() {
  const [search, setSearch] = useState("");
  const path = useMemo(() => {
    const q = new URLSearchParams();
    if (search) q.set("search", search);
    const qs = q.toString();
    return `/api/admin/menu${qs ? `?${qs}` : ""}`;
  }, [search]);

  const { data, isLoading } = useAdminList<MenuItem[]>(path);
  const { data: categories } = useAdminList<Category[]>("/api/admin/categories");
  const items = data || [];

  const remove = async (id: string) => {
    if (!confirm("Remove this dish from the catalog?")) return;
    await adminDelete(`/api/admin/menu/${id}`);
    mutate(path);
  };

  return (
    <AdminShell title="Menu Management">
      <div className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-[#111827]">Platform Menu</h1>
          <p className="text-[#6B7280]">Review dishes and manage cuisine categories.</p>
        </div>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search dishes…"
          className="bg-white border border-[#E5E7EB] rounded-xl px-4 py-2.5 text-sm"
        />
      </div>

      <div className="mb-8">
        <h2 className="text-lg font-bold text-[#111827] mb-3">Categories</h2>
        <div className="flex flex-wrap gap-2">
          {(categories || []).map((c) => (
            <span key={c.id} className="bg-white border border-[#E5E7EB] rounded-full px-4 py-2 text-sm font-bold text-[#6B7280]">
              {c.name} <span className="text-[#E23744]">({c.restaurant_count || 0})</span>
            </span>
          ))}
        </div>
      </div>

      {isLoading && <p className="text-sm text-[#6B7280] mb-4">Loading…</p>}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {items.map((item) => (
          <div key={item.id} className="bg-white rounded-2xl border border-[#E5E7EB] overflow-hidden flex gap-3 p-3">
            <div className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0">
              <SafeImage src={item.image_url || FOOD_FALLBACK} fallback={FOOD_FALLBACK} alt={item.name} className="w-full h-full object-cover" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-[#111827] truncate">{item.name}</p>
              <p className="text-xs text-[#6B7280] truncate">{item.restaurant_name}</p>
              <p className="text-xs text-[#9CA3AF]">{item.category_name || "Uncategorized"} · {item.is_vegetarian ? "Veg" : "Non-Veg"}</p>
              <div className="flex items-center justify-between mt-2">
                <span className="font-black text-sm">{formatCurrency(item.price)}</span>
                <button type="button" onClick={() => remove(item.id)} className="text-xs font-bold text-red-500">Remove</button>
              </div>
            </div>
          </div>
        ))}
      </div>
      {!items.length && !isLoading && <p className="text-center text-[#9CA3AF] py-16">No dishes found.</p>}
    </AdminShell>
  );
}
