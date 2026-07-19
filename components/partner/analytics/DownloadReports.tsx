"use client";

import { Download, FileText, FileSpreadsheet } from "lucide-react";
import { motion } from "framer-motion";
import { getAccessToken } from "@/lib/accessToken";

const API = process.env.NEXT_PUBLIC_API_URL || "https://foodiq-2.onrender.com";

export default function DownloadReports() {
  const download = async (format: "csv" | "pdf") => {
    const token = getAccessToken();
    if (!token) return;
    const res = await fetch(
      `${API}/api/analytics/restaurant?days=30`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const json = await res.json();
    const data = json?.data || {};
    if (format === "csv") {
      const lines = [
        "metric,value",
        `revenue,${data.revenue?.revenue ?? 0}`,
        `orders,${data.revenue?.orders ?? 0}`,
        `aov,${data.aov ?? 0}`,
        "",
        "dish,orders,revenue",
        ...(data.top_dishes || []).map(
          (d: { name: string; orders_count: number; revenue: number }) =>
            `"${d.name}",${d.orders_count},${d.revenue}`
        ),
      ];
      const blob = new Blob([lines.join("\n")], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "restaurant-analytics.csv";
      a.click();
      URL.revokeObjectURL(url);
      return;
    }
    // PDF via admin export isn't restaurant-scoped; generate simple text download as .txt printable
    const text = [
      "Foodiq Restaurant Analytics",
      `Revenue: ${data.revenue?.revenue ?? 0}`,
      `Orders: ${data.revenue?.orders ?? 0}`,
      `AOV: ${data.aov ?? 0}`,
      "",
      "Top dishes:",
      ...(data.top_dishes || []).map(
        (d: { name: string; orders_count: number }) =>
          `- ${d.name}: ${d.orders_count}`
      ),
    ].join("\n");
    const blob = new Blob([text], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "restaurant-analytics.txt";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-[#FFFFFF] rounded-3xl p-6 md:p-8 border border-[#E5E7EB] shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
      <div>
        <h3 className="text-xl font-black text-[#111827] flex items-center gap-2 mb-2">
          <Download className="w-6 h-6 text-[#6B7280]" /> Download Reports
        </h3>
        <p className="text-[#6B7280] text-sm">
          Export your analytics data for accounting or offline review.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          type="button"
          onClick={() => void download("pdf")}
          className="flex items-center gap-2 bg-[#F8FAFC] hover:bg-[#F8FAFC] border border-[#E5E7EB] text-[#111827] px-6 py-3 rounded-xl font-bold transition-colors shadow-lg"
        >
          <FileText className="w-5 h-5 text-red-400" />
          PDF Report
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          type="button"
          onClick={() => void download("csv")}
          className="flex items-center gap-2 bg-[#F8FAFC] hover:bg-[#F8FAFC] border border-[#E5E7EB] text-[#111827] px-6 py-3 rounded-xl font-bold transition-colors shadow-lg"
        >
          <FileSpreadsheet className="w-5 h-5 text-green-400" />
          CSV Export
        </motion.button>
      </div>
    </div>
  );
}
