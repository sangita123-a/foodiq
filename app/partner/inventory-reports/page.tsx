"use client";

import useSWR from "swr";
import PartnerSidebar from "@/components/partner/PartnerSidebar";
import PartnerHeader from "@/components/partner/PartnerHeader";
import { inventoryFetcher, type InventoryReports } from "@/services/partnerInventoryApi";
import { BarChart3, TrendingDown, TrendingUp, Wallet } from "lucide-react";

export default function PartnerInventoryReportsPage() {
  const { data, isLoading } = useSWR<InventoryReports>("/api/partner/inventory/reports", inventoryFetcher);

  return (
    <div className="min-h-screen bg-section flex">
      <div className="hidden lg:block w-64 flex-shrink-0">
        <PartnerSidebar />
      </div>
      <div className="flex-1 flex flex-col min-w-0">
        <PartnerHeader />
        <main className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">
          <div className="max-w-6xl mx-auto space-y-6">
            <div>
              <h1 className="text-3xl font-black text-foreground flex items-center gap-2">
                <BarChart3 className="w-8 h-8 text-primary" /> Inventory Reports
              </h1>
              <p className="text-gray-text">Consumption, wastage, food cost, and stock analytics.</p>
            </div>

            {isLoading && <p className="text-sm text-gray-text">Loading reports…</p>}

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: "Inventory Value", value: `₹${Number(data?.inventory_value || 0).toLocaleString()}`, icon: Wallet },
                { label: "Food Cost %", value: `${Number(data?.food_cost_percent || 0).toFixed(1)}%`, icon: TrendingUp },
                { label: "Inventory Turnover", value: Number(data?.inventory_turnover || 0).toFixed(2), icon: TrendingUp },
                { label: "Low Stock Items", value: String(data?.low_stock?.length || 0), icon: TrendingDown },
              ].map((s) => (
                <div key={s.label} className="bg-white rounded-2xl border border-border p-4">
                  <p className="text-xs font-bold uppercase text-[#9CA3AF]">{s.label}</p>
                  <p className="text-2xl font-black text-foreground">{s.value}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ReportCard title="Daily Consumption (7 days)">
                {(data?.daily_consumption || []).map((r) => (
                  <div key={r.day} className="flex justify-between text-sm py-1 border-b border-[#F8FAFC]">
                    <span>{new Date(r.day).toLocaleDateString()}</span>
                    <span className="font-bold">{Number(r.consumed).toFixed(1)}</span>
                  </div>
                ))}
              </ReportCard>

              <ReportCard title="Weekly Consumption">
                {(data?.weekly_consumption || []).map((r) => (
                  <div key={String(r.week_start)} className="flex justify-between text-sm py-1 border-b border-[#F8FAFC]">
                    <span>{new Date(r.week_start).toLocaleDateString()}</span>
                    <span className="font-bold">{Number(r.consumed).toFixed(1)}</span>
                  </div>
                ))}
              </ReportCard>

              <ReportCard title="Most Consumed (30 days)">
                {(data?.most_consumed || []).map((r) => (
                  <div key={r.name} className="flex justify-between text-sm py-1 border-b border-[#F8FAFC]">
                    <span>{r.name}</span>
                    <span className="font-bold">{Number(r.total_used).toFixed(1)}</span>
                  </div>
                ))}
              </ReportCard>

              <ReportCard title="Least Used (30 days)">
                {(data?.least_used || []).map((r) => (
                  <div key={r.name} className="flex justify-between text-sm py-1 border-b border-[#F8FAFC]">
                    <span>{r.name}</span>
                    <span className="font-bold">{Number(r.total_used).toFixed(1)}</span>
                  </div>
                ))}
              </ReportCard>

              <ReportCard title="Wastage Report">
                {(data?.wastage || []).map((r) => (
                  <div key={r.name} className="flex justify-between text-sm py-1 border-b border-[#F8FAFC]">
                    <span>{r.name}</span>
                    <span className="font-bold text-red-600">{Number(r.wasted).toFixed(1)}</span>
                  </div>
                ))}
                {!data?.wastage?.length && <p className="text-sm text-[#9CA3AF]">No wastage recorded</p>}
              </ReportCard>

              <ReportCard title="Low Stock Report">
                {(data?.low_stock || []).map((r) => (
                  <div key={r.name} className="flex justify-between text-sm py-1 border-b border-[#F8FAFC]">
                    <span>{r.name}</span>
                    <span className="font-bold text-amber-600">{Number(r.quantity)} {r.unit}</span>
                  </div>
                ))}
              </ReportCard>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

function ReportCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-3xl border border-border p-5">
      <h2 className="font-black text-foreground mb-3 text-sm uppercase tracking-wide">{title}</h2>
      <div className="space-y-1">{children}</div>
    </div>
  );
}
