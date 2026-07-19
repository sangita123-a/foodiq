"use client";

import { useMemo, useState } from "react";
import AdminShell from "@/components/admin/AdminShell";
import { BiBarChart, BiKpi, BiLineChart } from "@/components/admin/BiCharts";
import { useAdminList } from "@/hooks/useAdminData";
import { formatCurrency } from "@/services/adminApi";
import { getAccessToken as getToken } from "@/lib/accessToken";
import { Download, LineChart, Mail, RefreshCw } from "lucide-react";

type BiDash = {
  days: number;
  generated_at?: string;
  revenue?: {
    revenue: number;
    gmv: number;
    orders: number;
    delivered_orders: number;
    cancelled_orders: number;
    aov: number;
  };
  aov?: number;
  revenue_daily?: Array<{ day: string; orders: number; revenue: number }>;
  orders?: {
    realtime?: {
      last_hour: number;
      last_24h: number;
      gmv_last_hour: number;
      gmv_last_24h: number;
    };
    by_status?: Array<{ status: string; count: number }>;
  };
  conversion_funnel?: {
    stages: Array<{ stage: string; count: number; conversion_from_prev: number }>;
  };
  retention?: {
    cohort_size: number;
    rate_7d: number;
    rate_30d: number;
  };
  clv?: {
    averages?: { avg_clv: number; avg_aov: number };
    top_customers?: Array<{
      full_name: string;
      email: string;
      orders: number;
      clv: number;
    }>;
  };
  cart_abandonment?: { abandonment_rate: number; abandoned: number; carts_with_items: number };
  popular_restaurants?: Array<{
    id: string;
    name: string;
    orders: number;
    revenue: number;
    rating: number;
  }>;
  popular_dishes?: Array<{
    id: string;
    name: string;
    restaurant_name: string;
    orders_count: number;
    revenue: number;
  }>;
  peak_hours?: { hours: Array<{ hour: number; orders: number }>; peak_hour: number | null };
  city_sales?: { cities: Array<{ city: string; orders: number; revenue: number }> };
  coupon_performance?: {
    coupons: Array<{ code: string; redemptions: number; order_gmv: number }>;
  };
  campaign_analytics?: {
    campaigns: Array<{
      title: string;
      offer_code: string;
      attributed_orders: number;
      attributed_gmv: number;
    }>;
  };
  delivery_performance?: {
    summary?: {
      delivered: number;
      cancelled: number;
      avg_delivery_minutes: number;
      active_riders: number;
    };
  };
  customer_growth?: { summary?: { new_customers: number; total_customers: number; new_7d: number } };
  restaurant_growth?: { summary?: { total: number; active: number; new_in_period: number } };
  anomalies?: {
    anomalies: Array<{
      day: string;
      direction: string;
      severity: string;
      orders: number;
      gmv: number;
    }>;
  };
  ai_insights?: { insights: Array<{ type: string; severity: string; message: string }> };
};

const API = process.env.NEXT_PUBLIC_API_URL || "https://foodiq-2.onrender.com";

export default function AdminBiPage() {
  const [days, setDays] = useState(30);
  const { data, isLoading, mutate } = useAdminList<BiDash>(
    `/api/analytics/admin/dashboard?days=${days}`
  );
  const [busy, setBusy] = useState(false);

  const salesPoints = useMemo(
    () =>
      (data?.revenue_daily || []).map((d) => ({
        label: String(d.day).slice(5),
        value: Number(d.revenue) || 0,
      })),
    [data?.revenue_daily]
  );
  const peakPoints = useMemo(
    () =>
      (data?.peak_hours?.hours || []).map((h) => ({
        label: String(h.hour),
        value: h.orders,
      })),
    [data?.peak_hours]
  );

  const exportReport = async (format: string) => {
    const token = getToken();
    if (!token) return;
    setBusy(true);
    try {
      const res = await fetch(
        `${API}/api/analytics/admin/export?format=${format}&days=${days}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `foodiq-bi-${days}d.${format === "excel" ? "xls" : format}`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setBusy(false);
    }
  };

  const emailReport = async () => {
    const token = getToken();
    if (!token) return;
    setBusy(true);
    try {
      await fetch(`${API}/api/analytics/admin/email-report`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
    } finally {
      setBusy(false);
    }
  };

  const rev = data?.revenue;
  const rt = data?.orders?.realtime;

  return (
    <AdminShell title="Business Intelligence">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#E23744]/10 flex items-center justify-center">
            <LineChart className="w-5 h-5 text-[#E23744]" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-[#111827]">
              Analytics & Business Intelligence
            </h1>
            <p className="text-[#6B7280]">
              Sales, growth, funnel, CLV, campaigns — last {days} days.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {[7, 30, 90].map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setDays(d)}
              className={`px-3 py-1.5 rounded-xl text-sm font-bold border ${
                days === d
                  ? "bg-[#E23744] text-white border-[#E23744]"
                  : "bg-white text-[#6B7280] border-[#E5E7EB]"
              }`}
            >
              {d}d
            </button>
          ))}
          <button
            type="button"
            onClick={() => mutate()}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-[#E5E7EB] text-sm font-bold text-[#6B7280]"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => void exportReport("csv")}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-[#E5E7EB] text-sm font-bold text-[#6B7280]"
          >
            <Download className="w-3.5 h-3.5" /> CSV
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => void exportReport("excel")}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-[#E5E7EB] text-sm font-bold text-[#6B7280]"
          >
            Excel
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => void exportReport("pdf")}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-[#E5E7EB] text-sm font-bold text-[#6B7280]"
          >
            PDF
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => void emailReport()}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#E23744] text-white text-sm font-bold"
          >
            <Mail className="w-3.5 h-3.5" /> Email
          </button>
        </div>
      </div>

      {isLoading && <p className="text-sm text-[#6B7280] mb-4">Loading…</p>}

      <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4 mb-6">
        <BiKpi label="Revenue" value={rev ? formatCurrency(rev.revenue) : "—"} />
        <BiKpi label="GMV" value={rev ? formatCurrency(rev.gmv) : "—"} />
        <BiKpi label="Orders" value={rev?.orders ?? "—"} />
        <BiKpi label="AOV" value={formatCurrency(data?.aov || rev?.aov || 0)} />
        <BiKpi
          label="Realtime (1h)"
          value={rt?.last_hour ?? "—"}
          hint={rt ? formatCurrency(rt.gmv_last_hour) : undefined}
        />
        <BiKpi
          label="Retention 30d"
          value={data?.retention ? `${data.retention.rate_30d}%` : "—"}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-3xl border border-[#E5E7EB] p-6">
          <h2 className="font-bold text-lg mb-4">Revenue trend</h2>
          <BiLineChart data={salesPoints} />
        </div>
        <div className="bg-white rounded-3xl border border-[#E5E7EB] p-6">
          <h2 className="font-bold text-lg mb-4">
            Peak hours
            {data?.peak_hours?.peak_hour != null
              ? ` · peak ${data.peak_hours.peak_hour}:00`
              : ""}
          </h2>
          <BiBarChart data={peakPoints} color="#60A5FA" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="bg-white rounded-3xl border border-[#E5E7EB] p-6">
          <h2 className="font-bold text-lg mb-4">Conversion funnel</h2>
          <div className="space-y-3">
            {(data?.conversion_funnel?.stages || []).map((s) => (
              <div key={s.stage}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-bold text-[#111827]">{s.stage}</span>
                  <span className="text-[#6B7280]">
                    {s.count} · {s.conversion_from_prev}%
                  </span>
                </div>
                <div className="h-2 bg-[#F8FAFC] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#E23744] rounded-full"
                    style={{
                      width: `${Math.min(100, s.conversion_from_prev || 0)}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white rounded-3xl border border-[#E5E7EB] p-6">
          <h2 className="font-bold text-lg mb-4">Growth & delivery</h2>
          <ul className="text-sm space-y-2 text-[#6B7280]">
            <li>
              New customers:{" "}
              <strong className="text-[#111827]">
                {data?.customer_growth?.summary?.new_customers ?? "—"}
              </strong>
            </li>
            <li>
              New restaurants:{" "}
              <strong className="text-[#111827]">
                {data?.restaurant_growth?.summary?.new_in_period ?? "—"}
              </strong>
            </li>
            <li>
              Avg delivery:{" "}
              <strong className="text-[#111827]">
                {Math.round(
                  data?.delivery_performance?.summary?.avg_delivery_minutes || 0
                )}{" "}
                min
              </strong>
            </li>
            <li>
              Cart abandon:{" "}
              <strong className="text-[#111827]">
                {data?.cart_abandonment?.abandonment_rate ?? "—"}%
              </strong>
            </li>
            <li>
              Avg CLV:{" "}
              <strong className="text-[#111827]">
                {formatCurrency(data?.clv?.averages?.avg_clv || 0)}
              </strong>
            </li>
          </ul>
        </div>
        <div className="bg-white rounded-3xl border border-[#E5E7EB] p-6">
          <h2 className="font-bold text-lg mb-4">AI insights</h2>
          <div className="space-y-2 max-h-56 overflow-y-auto">
            {(data?.ai_insights?.insights || []).map((i, idx) => (
              <p
                key={idx}
                className={`text-sm rounded-xl px-3 py-2 ${
                  i.severity === "warning"
                    ? "bg-amber-50 text-amber-800"
                    : i.severity === "high"
                      ? "bg-red-50 text-red-700"
                      : i.severity === "positive"
                        ? "bg-green-50 text-green-700"
                        : "bg-[#F8FAFC] text-[#6B7280]"
                }`}
              >
                {i.message}
              </p>
            ))}
            {!data?.ai_insights?.insights?.length && (
              <p className="text-sm text-[#6B7280]">No insights yet.</p>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-3xl border border-[#E5E7EB] p-6">
          <h2 className="font-bold text-lg mb-4">Most popular restaurants</h2>
          <div className="space-y-2">
            {(data?.popular_restaurants || []).map((r) => (
              <div
                key={r.id}
                className="flex justify-between text-sm border-b border-[#E5E7EB] py-2"
              >
                <div>
                  <p className="font-bold">{r.name}</p>
                  <p className="text-xs text-[#6B7280]">
                    ★ {r.rating || 0} · {r.orders} orders
                  </p>
                </div>
                <p className="font-black text-green-600">
                  {formatCurrency(r.revenue)}
                </p>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white rounded-3xl border border-[#E5E7EB] p-6">
          <h2 className="font-bold text-lg mb-4">Most popular dishes</h2>
          <div className="space-y-2">
            {(data?.popular_dishes || []).map((d) => (
              <div
                key={d.id}
                className="flex justify-between text-sm border-b border-[#E5E7EB] py-2"
              >
                <div>
                  <p className="font-bold">{d.name}</p>
                  <p className="text-xs text-[#6B7280]">{d.restaurant_name}</p>
                </div>
                <div className="text-right">
                  <p className="font-black">{d.orders_count}</p>
                  <p className="text-xs text-green-600">
                    {formatCurrency(d.revenue)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="bg-white rounded-3xl border border-[#E5E7EB] p-6">
          <h2 className="font-bold text-lg mb-4">City-wise sales</h2>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {(data?.city_sales?.cities || []).map((c, i) => (
              <div
                key={`${c.city}-${i}`}
                className="flex justify-between text-sm border-b border-[#E5E7EB] py-2"
              >
                <span className="font-bold">{c.city}</span>
                <span className="text-green-600 font-black">
                  {formatCurrency(c.revenue)}
                </span>
              </div>
            ))}
            {!data?.city_sales?.cities?.length && (
              <p className="text-sm text-[#6B7280]">No city data.</p>
            )}
          </div>
        </div>
        <div className="bg-white rounded-3xl border border-[#E5E7EB] p-6">
          <h2 className="font-bold text-lg mb-4">Coupon performance</h2>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {(data?.coupon_performance?.coupons || []).map((c) => (
              <div
                key={c.code}
                className="flex justify-between text-sm border-b border-[#E5E7EB] py-2"
              >
                <span className="font-mono font-bold">{c.code}</span>
                <span className="text-[#6B7280]">
                  {c.redemptions} · {formatCurrency(c.order_gmv)}
                </span>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white rounded-3xl border border-[#E5E7EB] p-6">
          <h2 className="font-bold text-lg mb-4">Campaigns & anomalies</h2>
          <div className="space-y-2 mb-4">
            {(data?.campaign_analytics?.campaigns || []).slice(0, 5).map((c) => (
              <p key={c.title} className="text-sm">
                <span className="font-bold">{c.title}</span>
                <span className="text-[#6B7280]">
                  {" "}
                  · {c.attributed_orders} orders
                </span>
              </p>
            ))}
          </div>
          {(data?.anomalies?.anomalies || []).slice(-4).map((a) => (
            <p
              key={String(a.day)}
              className="text-xs text-[#6B7280] border-t border-[#E5E7EB] py-1"
            >
              {a.day}: {a.direction} ({a.severity}) — {a.orders} orders
            </p>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-[#E5E7EB] p-6">
        <h2 className="font-bold text-lg mb-4">Top customers by CLV</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {(data?.clv?.top_customers || []).map((u) => (
            <div
              key={u.email}
              className="rounded-xl bg-[#F8FAFC] border border-[#E5E7EB] p-3"
            >
              <p className="font-bold text-sm text-[#111827]">
                {u.full_name || u.email}
              </p>
              <p className="text-xs text-[#6B7280]">
                {u.orders} orders · {formatCurrency(u.clv)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </AdminShell>
  );
}
