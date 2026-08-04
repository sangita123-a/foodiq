"use client";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { formatCurrency, type AdminRestaurantRevenuePoint, type AdminRestaurantAnalytics } from "@/services/adminApi";

const GRID = "#e1e0d9";
const MUTED = "#898781";
const SURFACE = "#fcfcfb";
const BORDER = "rgba(11,11,11,0.10)";

const axisTickStyle = { fill: MUTED, fontSize: 11 };

const tooltipStyle = {
  background: SURFACE,
  border: `1px solid ${BORDER}`,
  borderRadius: 12,
  fontSize: 12,
  boxShadow: "0 8px 24px rgba(11,11,11,0.08)",
};

function ChartCard({ title, empty, children }: { title: string; empty: boolean; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-border p-5 shadow-sm">
      <p className="text-xs font-bold uppercase tracking-widest text-[#9CA3AF] mb-3">{title}</p>
      {empty ? (
        <div className="h-56 flex items-center justify-center text-sm text-gray-text">No data for this period.</div>
      ) : (
        <div className="h-56">{children}</div>
      )}
    </div>
  );
}

export default function RestaurantAnalyticsCharts({
  revenueTrend,
  analytics,
}: {
  revenueTrend?: AdminRestaurantRevenuePoint[];
  analytics?: AdminRestaurantAnalytics;
}) {
  const revenue = revenueTrend || [];
  const peakHours = (analytics?.peak_hours || []).map((h) => ({ ...h, label: `${h.hour}:00` }));
  const bestSellers = (analytics?.best_sellers || []).slice(0, 8);
  const customerGrowth = analytics?.customer_growth || [];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <ChartCard title="Revenue Chart" empty={!revenue.length}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={revenue} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid stroke={GRID} strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="date" tick={axisTickStyle} axisLine={{ stroke: GRID }} tickLine={false} />
            <YAxis tick={axisTickStyle} axisLine={false} tickLine={false} width={48} />
            <Tooltip
              contentStyle={tooltipStyle}
              formatter={(v) => [formatCurrency(Number(v)), "Revenue"]}
              labelStyle={{ color: "#0b0b0b", fontWeight: 700 }}
            />
            <Area type="monotone" dataKey="revenue" stroke="#E23744" strokeWidth={2} fill="#E23744" fillOpacity={0.12} />
          </AreaChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Order Trend" empty={!revenue.length}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={revenue} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid stroke={GRID} strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="date" tick={axisTickStyle} axisLine={{ stroke: GRID }} tickLine={false} />
            <YAxis tick={axisTickStyle} axisLine={false} tickLine={false} width={32} allowDecimals={false} />
            <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: "#0b0b0b", fontWeight: 700 }} />
            <Line type="monotone" dataKey="orders" name="Orders" stroke="#2a78d6" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="cancelled" name="Cancelled" stroke="#e34948" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Peak Hours" empty={!peakHours.length}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={peakHours} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid stroke={GRID} strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="label" tick={axisTickStyle} axisLine={{ stroke: GRID }} tickLine={false} interval={2} />
            <YAxis tick={axisTickStyle} axisLine={false} tickLine={false} width={32} allowDecimals={false} />
            <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: "#0b0b0b", fontWeight: 700 }} />
            <Bar dataKey="orders" name="Orders" fill="#eb6834" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Best Selling Items" empty={!bestSellers.length}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={bestSellers} layout="vertical" margin={{ top: 4, right: 16, left: 8, bottom: 0 }}>
            <CartesianGrid stroke={GRID} strokeDasharray="3 3" horizontal={false} />
            <XAxis type="number" tick={axisTickStyle} axisLine={false} tickLine={false} allowDecimals={false} />
            <YAxis
              type="category"
              dataKey="name"
              tick={{ ...axisTickStyle, fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              width={110}
            />
            <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: "#0b0b0b", fontWeight: 700 }} />
            <Bar dataKey="qty" name="Qty Sold" fill="#1baf7a" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Customer Growth" empty={!customerGrowth.length}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={customerGrowth} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid stroke={GRID} strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="date" tick={axisTickStyle} axisLine={{ stroke: GRID }} tickLine={false} />
            <YAxis tick={axisTickStyle} axisLine={false} tickLine={false} width={32} allowDecimals={false} />
            <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: "#0b0b0b", fontWeight: 700 }} />
            <Line type="monotone" dataKey="customers" name="New Customers" stroke="#4a3aa7" strokeWidth={2} dot={{ r: 3 }} />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
}
