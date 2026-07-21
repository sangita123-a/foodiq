"use client";

import AdminShell from "@/components/admin/AdminShell";
import { useAdminList } from "@/hooks/useAdminData";
import { formatCurrency } from "@/services/adminApi";

type Analytics = {
  top_dishes: Array<{ id: string; name: string; restaurant_name: string; orders_count: number; revenue: number }>;
  restaurant_performance: Array<{ id: string; name: string; rating: number; orders: number; revenue: number }>;
  customer_growth: Array<{ week: string; users: number }>;
  peak_hours: Array<{ hour: number; orders: number }>;
  sales_daily: Array<{ day: string; orders: number; revenue: number }>;
};

export default function AdminAnalyticsPage() {
  const { data, isLoading } = useAdminList<Analytics>("/api/admin/analytics");
  const peakMax = Math.max(...(data?.peak_hours || []).map((h) => h.orders), 1);
  const salesMax = Math.max(...(data?.sales_daily || []).map((d) => d.revenue), 1);

  return (
    <AdminShell title="Reports & Analytics">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-foreground">Analytics</h1>
          <p className="text-gray-text">
            Sales, restaurant performance, growth, and peak hours.{" "}
            <a href="/admin/bi" className="text-primary font-bold">
              Open full BI dashboard →
            </a>
          </p>
        </div>
      </div>

      {isLoading && <p className="text-sm text-gray-text mb-4">Loading…</p>}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-3xl border border-border p-6">
          <h2 className="font-bold text-lg mb-4">Daily Sales (14 days)</h2>
          <div className="h-40 flex items-end gap-1">
            {(data?.sales_daily || []).map((d) => (
              <div key={d.day} className="flex-1 bg-primary/25 border border-primary/40 rounded-t" style={{ height: `${Math.max(6, Math.round((d.revenue / salesMax) * 100))}%` }} title={formatCurrency(d.revenue)} />
            ))}
          </div>
        </div>
        <div className="bg-white rounded-3xl border border-border p-6">
          <h2 className="font-bold text-lg mb-4">Peak Ordering Hours</h2>
          <div className="h-40 flex items-end gap-1">
            {(data?.peak_hours || []).map((h) => (
              <div key={h.hour} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full bg-blue-400/30 border border-blue-400/40 rounded-t" style={{ height: `${Math.max(6, Math.round((h.orders / peakMax) * 100))}%` }} />
                <span className="text-[9px] text-[#9CA3AF]">{h.hour}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-3xl border border-border p-6">
          <h2 className="font-bold text-lg mb-4">Most Ordered Dishes</h2>
          <div className="space-y-2">
            {(data?.top_dishes || []).map((d) => (
              <div key={d.id} className="flex justify-between text-sm border-b border-border py-2">
                <div>
                  <p className="font-bold">{d.name}</p>
                  <p className="text-xs text-gray-text">{d.restaurant_name}</p>
                </div>
                <div className="text-right">
                  <p className="font-black">{d.orders_count}</p>
                  <p className="text-xs text-green-600">{formatCurrency(d.revenue)}</p>
                </div>
              </div>
            ))}
            {!data?.top_dishes?.length && <p className="text-sm text-gray-text">No data yet.</p>}
          </div>
        </div>
        <div className="bg-white rounded-3xl border border-border p-6">
          <h2 className="font-bold text-lg mb-4">Restaurant Performance</h2>
          <div className="space-y-2">
            {(data?.restaurant_performance || []).map((r) => (
              <div key={r.id} className="flex justify-between text-sm border-b border-border py-2">
                <div>
                  <p className="font-bold">{r.name}</p>
                  <p className="text-xs text-gray-text">★ {r.rating || 0} · {r.orders} orders</p>
                </div>
                <p className="font-black text-green-600">{formatCurrency(r.revenue)}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-border p-6">
        <h2 className="font-bold text-lg mb-4">Customer Growth (weekly)</h2>
        <div className="flex flex-wrap gap-3">
          {(data?.customer_growth || []).map((w) => (
            <div key={w.week} className="bg-section border border-border rounded-xl px-4 py-3">
              <p className="text-xs text-gray-text">{new Date(w.week).toLocaleDateString()}</p>
              <p className="font-black text-lg">+{w.users}</p>
            </div>
          ))}
          {!data?.customer_growth?.length && <p className="text-sm text-gray-text">No growth data yet.</p>}
        </div>
      </div>
    </AdminShell>
  );
}
