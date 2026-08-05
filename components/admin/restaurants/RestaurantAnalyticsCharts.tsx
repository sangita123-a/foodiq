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
import {
  CHART_GRID,
  chartColor,
  chartAxisTick,
  chartTooltipStyle,
  chartTooltipLabelStyle,
} from "@/lib/adminChartTheme";

function ChartCard({ title, empty, children }: { title: string; empty: boolean; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-border p-5 shadow-[var(--shadow-admin-soft)]">
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
            <CartesianGrid stroke={CHART_GRID} strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="date" tick={chartAxisTick} axisLine={{ stroke: CHART_GRID }} tickLine={false} />
            <YAxis tick={chartAxisTick} axisLine={false} tickLine={false} width={48} />
            <Tooltip
              contentStyle={chartTooltipStyle}
              formatter={(v) => [formatCurrency(Number(v)), "Revenue"]}
              labelStyle={chartTooltipLabelStyle}
            />
            <Area type="monotone" dataKey="revenue" stroke={chartColor(0)} strokeWidth={2} fill={chartColor(0)} fillOpacity={0.12} />
          </AreaChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Order Trend" empty={!revenue.length}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={revenue} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid stroke={CHART_GRID} strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="date" tick={chartAxisTick} axisLine={{ stroke: CHART_GRID }} tickLine={false} />
            <YAxis tick={chartAxisTick} axisLine={false} tickLine={false} width={32} allowDecimals={false} />
            <Tooltip contentStyle={chartTooltipStyle} labelStyle={chartTooltipLabelStyle} />
            <Line type="monotone" dataKey="orders" name="Orders" stroke={chartColor(1)} strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="cancelled" name="Cancelled" stroke={chartColor(6)} strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Peak Hours" empty={!peakHours.length}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={peakHours} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid stroke={CHART_GRID} strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="label" tick={chartAxisTick} axisLine={{ stroke: CHART_GRID }} tickLine={false} interval={2} />
            <YAxis tick={chartAxisTick} axisLine={false} tickLine={false} width={32} allowDecimals={false} />
            <Tooltip contentStyle={chartTooltipStyle} labelStyle={chartTooltipLabelStyle} />
            <Bar dataKey="orders" name="Orders" fill={chartColor(3)} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Best Selling Items" empty={!bestSellers.length}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={bestSellers} layout="vertical" margin={{ top: 4, right: 16, left: 8, bottom: 0 }}>
            <CartesianGrid stroke={CHART_GRID} strokeDasharray="3 3" horizontal={false} />
            <XAxis type="number" tick={chartAxisTick} axisLine={false} tickLine={false} allowDecimals={false} />
            <YAxis
              type="category"
              dataKey="name"
              tick={{ ...chartAxisTick, fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              width={110}
            />
            <Tooltip contentStyle={chartTooltipStyle} labelStyle={chartTooltipLabelStyle} />
            <Bar dataKey="qty" name="Qty Sold" fill={chartColor(2)} radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Customer Growth" empty={!customerGrowth.length}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={customerGrowth} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid stroke={CHART_GRID} strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="date" tick={chartAxisTick} axisLine={{ stroke: CHART_GRID }} tickLine={false} />
            <YAxis tick={chartAxisTick} axisLine={false} tickLine={false} width={32} allowDecimals={false} />
            <Tooltip contentStyle={chartTooltipStyle} labelStyle={chartTooltipLabelStyle} />
            <Line type="monotone" dataKey="customers" name="New Customers" stroke={chartColor(4)} strokeWidth={2} dot={{ r: 3 }} />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
}
