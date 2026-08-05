"use client";

import { useMemo } from "react";
import { Bike, MapPin, Star } from "lucide-react";
import { useAdminList } from "@/hooks/useAdminData";
import { PanelSkeleton } from "./Skeleton";

type PartnerRow = {
  id: string;
  full_name?: string;
  vehicle_type?: string;
  is_available?: boolean;
  is_online?: boolean;
  rating?: number;
  current_lat?: number | string | null;
  current_lng?: number | string | null;
  current_order_id?: string | null;
  updated_at?: string;
};

function statusOf(p: PartnerRow) {
  if (p.current_order_id) return { label: "Busy", dot: "bg-amber-500", text: "text-amber-700", bg: "bg-amber-50" };
  if (p.is_available) return { label: "Available", dot: "bg-emerald-500", text: "text-emerald-700", bg: "bg-emerald-50" };
  return { label: "Offline", dot: "bg-gray-400", text: "text-gray-text", bg: "bg-section" };
}

export default function LiveDeliveryPartnersPanel() {
  const { data, isLoading } = useAdminList<PartnerRow[]>("/api/admin/delivery-partners?status=approved");
  const partners = useMemo(() => data || [], [data]);

  const online = partners.filter((p) => p.is_available).length;
  const busy = partners.filter((p) => p.current_order_id).length;

  const sorted = useMemo(
    () =>
      [...partners].sort((a, b) => {
        const rank = (p: PartnerRow) => (p.current_order_id ? 0 : p.is_available ? 1 : 2);
        return rank(a) - rank(b);
      }),
    [partners]
  );

  return (
    <section className="bg-white border border-border rounded-2xl p-5 sm:p-6 shadow-[var(--shadow-admin-soft)] hover:shadow-[var(--shadow-admin-lifted)] transition-shadow duration-200">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-black text-foreground flex items-center gap-2">
          <Bike className="w-4 h-4 text-primary" /> Live Delivery Partners
        </h2>
        <span className="text-xs font-bold text-gray-text">
          {online} online · {busy} busy
        </span>
      </div>
      {isLoading ? (
        <PanelSkeleton rows={4} />
      ) : (
        <div className="space-y-2 max-h-[360px] overflow-y-auto custom-scrollbar">
          {sorted.length === 0 && <p className="text-sm text-gray-text">No approved delivery partners yet.</p>}
          {sorted.slice(0, 25).map((p) => {
            const s = statusOf(p);
            const hasLoc = p.current_lat != null && p.current_lng != null;
            return (
              <div key={p.id} className="rounded-xl border border-border bg-section px-3 py-2.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold text-sm text-foreground truncate">{p.full_name || "Partner"}</span>
                  <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${s.bg} ${s.text}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} /> {s.label}
                  </span>
                </div>
                <div className="flex items-center justify-between mt-1">
                  <p className="text-xs text-gray-text capitalize">
                    {p.vehicle_type || "bike"}
                    {p.current_order_id ? ` · Order #${p.current_order_id.slice(0, 8)}` : ""}
                  </p>
                  <div className="flex items-center gap-2 text-[11px] text-gray-text shrink-0">
                    {p.rating != null && (
                      <span className="inline-flex items-center gap-0.5">
                        <Star className="w-3 h-3 text-yellow-500" /> {Number(p.rating).toFixed(1)}
                      </span>
                    )}
                    {hasLoc && (
                      <span className="inline-flex items-center gap-0.5">
                        <MapPin className="w-3 h-3" /> {Number(p.current_lat).toFixed(3)}, {Number(p.current_lng).toFixed(3)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
