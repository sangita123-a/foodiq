// Shared chart palette for the admin dashboard. Every chart (Recharts or
// hand-rolled SVG/div) should pull its colors from here so series colors
// stay consistent and distinct from the #E23744 brand red across pages.
// Values mirror the --chart-* custom properties defined in
// app/admin/admin-theme.css (kept as JS constants too since Recharts/SVG
// props need literal values, not CSS var() strings, in some contexts).

import type { CSSProperties } from "react";

export const CHART_COLORS = [
  "#e23744", // brand red — primary series
  "#2563eb", // blue
  "#059669", // green
  "#d97706", // amber
  "#7c3aed", // violet
  "#0891b2", // cyan
  "#db2777", // pink
] as const;

export const CHART_GRID = "#eef0f2";
export const CHART_AXIS = "#9ca3af";
export const CHART_TOOLTIP_BG = "#17181c";
export const CHART_TOOLTIP_FG = "#ffffff";

export function chartColor(index: number): string {
  return CHART_COLORS[index % CHART_COLORS.length];
}

export const chartTooltipStyle: CSSProperties = {
  background: CHART_TOOLTIP_BG,
  color: CHART_TOOLTIP_FG,
  border: "none",
  borderRadius: 12,
  padding: "8px 12px",
  fontSize: 12,
  fontWeight: 600,
  boxShadow: "0 8px 24px rgba(17,17,17,0.24)",
};

export const chartTooltipLabelStyle: CSSProperties = {
  color: "rgba(255,255,255,0.6)",
  fontWeight: 500,
  marginBottom: 4,
};

export const chartAxisTick = { fill: CHART_AXIS, fontSize: 11, fontWeight: 600 };
