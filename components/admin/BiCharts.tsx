"use client";

import { useMemo, useState } from "react";

type Point = { label: string; value: number };

/** Interactive bar chart — Foodiq tokens, no extra chart library */
export function BiBarChart({
  data,
  height = 160,
  color = "#FC8019",
}: {
  data: Point[];
  height?: number;
  color?: string;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const max = Math.max(...data.map((d) => d.value), 1);

  return (
    <div className="relative">
      <div className="flex items-end gap-1" style={{ height }}>
        {data.map((d, i) => (
          <div
            key={`${d.label}-${i}`}
            className="flex-1 flex flex-col items-center justify-end h-full min-w-0"
            onMouseEnter={() => setHover(i)}
            onMouseLeave={() => setHover(null)}
          >
            <div
              className="w-full rounded-t transition-opacity"
              style={{
                height: `${Math.max(4, Math.round((d.value / max) * 100))}%`,
                backgroundColor: color,
                opacity: hover === null || hover === i ? 0.85 : 0.35,
              }}
              title={`${d.label}: ${d.value}`}
            />
            {data.length <= 24 ? (
              <span className="text-[9px] text-[#9CA3AF] mt-1 truncate w-full text-center">
                {d.label}
              </span>
            ) : null}
          </div>
        ))}
      </div>
      {hover != null && data[hover] ? (
        <div className="absolute -top-1 left-1/2 -translate-x-1/2 -translate-y-full bg-[#111827] text-white text-xs font-bold px-2 py-1 rounded-lg whitespace-nowrap pointer-events-none">
          {data[hover].label}: {data[hover].value}
        </div>
      ) : null}
    </div>
  );
}

/** Simple SVG line chart with hover dots */
export function BiLineChart({
  data,
  height = 160,
  color = "#FC8019",
}: {
  data: Point[];
  height?: number;
  color?: string;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const w = 400;
  const pad = 8;
  const max = Math.max(...data.map((d) => d.value), 1);

  const points = useMemo(() => {
    if (!data.length) return [];
    return data.map((d, i) => {
      const x =
        pad + (i / Math.max(data.length - 1, 1)) * (w - pad * 2);
      const y = height - pad - (d.value / max) * (height - pad * 2);
      return { x, y, ...d };
    });
  }, [data, height, max]);

  const path = points
    .map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`)
    .join(" ");

  return (
    <div className="relative w-full">
      <svg
        viewBox={`0 0 ${w} ${height}`}
        className="w-full h-40"
        preserveAspectRatio="none"
      >
        <path d={path} fill="none" stroke={color} strokeWidth="2.5" />
        {points.map((p, i) => (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r={hover === i ? 5 : 3}
            fill={color}
            onMouseEnter={() => setHover(i)}
            onMouseLeave={() => setHover(null)}
            className="cursor-pointer"
          />
        ))}
      </svg>
      {hover != null && points[hover] ? (
        <p className="text-xs font-bold text-[#6B7280] text-center">
          {points[hover].label}: {points[hover].value}
        </p>
      ) : null}
    </div>
  );
}

export function BiKpi({
  label,
  value,
  hint,
}: {
  label: string;
  value: string | number;
  hint?: string;
}) {
  return (
    <div className="bg-white rounded-3xl border border-[#E5E7EB] p-5">
      <p className="text-xs font-bold text-[#9CA3AF] uppercase tracking-wider">
        {label}
      </p>
      <p className="text-2xl font-black text-[#111827] mt-1">{value}</p>
      {hint ? <p className="text-xs text-[#6B7280] mt-1">{hint}</p> : null}
    </div>
  );
}
