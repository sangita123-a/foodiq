"use client";

import { useState } from "react";
import AdminShell from "@/components/admin/AdminShell";
import { adminGet, formatCurrency, formatDate } from "@/services/adminApi";
import api from "@/services/api";
import { Download, FileSpreadsheet } from "lucide-react";

type ReportRow = Record<string, unknown>;

const REPORT_TYPES = [
  { id: "sales", label: "Sales Report", endpoint: "/api/admin/reports/sales" },
  { id: "orders", label: "Order Report", endpoint: "/api/admin/reports/orders" },
  { id: "customers", label: "Customer Report", endpoint: "/api/admin/reports/users" },
  { id: "restaurants", label: "Restaurant Report", endpoint: "/api/admin/reports/restaurants" },
  { id: "payments", label: "Payment Report", endpoint: "/api/admin/reports/payments" },
  { id: "delivery", label: "Delivery Report", endpoint: "/api/admin/reports/delivery" },
];

export default function AdminReportsPage() {
  const [type, setType] = useState("sales");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [rows, setRows] = useState<ReportRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadReport = async () => {
    setLoading(true);
    setError("");
    try {
      const report = REPORT_TYPES.find((r) => r.id === type);
      if (!report) return;
      const params = new URLSearchParams();
      if (startDate) params.set("start_date", startDate);
      if (endDate) params.set("end_date", endDate);
      if (type === "sales") params.set("period", "day");
      const q = params.toString() ? `?${params}` : "";
      const data = await adminGet<ReportRow[]>(`${report.endpoint}${q}`);
      setRows(Array.isArray(data) ? data : []);
    } catch {
      setError("Failed to load report.");
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  const exportReport = async (format: "csv" | "json") => {
    const params = new URLSearchParams({ type, format });
    if (startDate) params.set("start_date", startDate);
    if (endDate) params.set("end_date", endDate);
    const res = await api.get(`/api/admin/reports/export?${params}`, {
      responseType: format === "csv" ? "blob" : "json",
    });
    const blob =
      format === "csv"
        ? new Blob([res.data as BlobPart], { type: "text/csv" })
        : new Blob([JSON.stringify((res.data as { data?: { rows?: ReportRow[] } }).data?.rows || res.data, null, 2)], {
            type: "application/json",
          });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${type}-report.${format === "csv" ? "csv" : "json"}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const formatCell = (key: string, val: unknown) => {
    if (val == null) return "—";
    if (key.includes("revenue") || key.includes("amount") || key.includes("earnings") || key.includes("settlement")) {
      return formatCurrency(Number(val));
    }
    if (key.includes("period") || key.includes("created_at") || key.includes("month")) {
      return formatDate(String(val));
    }
    return String(val);
  };

  const columns = rows.length ? Object.keys(rows[0]) : [];

  return (
    <AdminShell title="Reports">
      <div className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-[#111827]">Reports</h1>
          <p className="text-[#6B7280]">Generate and export sales, order, customer, delivery, and payment reports.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => exportReport("csv")}
            className="inline-flex items-center gap-2 bg-white border border-[#E5E7EB] px-4 py-2.5 rounded-xl text-sm font-bold text-[#111827]"
          >
            <FileSpreadsheet className="w-4 h-4" /> Export Excel (CSV)
          </button>
          <button
            type="button"
            onClick={() => exportReport("json")}
            className="inline-flex items-center gap-2 bg-[#E23744] text-white px-4 py-2.5 rounded-xl text-sm font-bold"
          >
            <Download className="w-4 h-4" /> Export PDF/JSON
          </button>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-[#E5E7EB] p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="border border-[#E5E7EB] rounded-xl px-4 py-3 text-sm"
          >
            {REPORT_TYPES.map((r) => (
              <option key={r.id} value={r.id}>{r.label}</option>
            ))}
          </select>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="border border-[#E5E7EB] rounded-xl px-4 py-3 text-sm"
          />
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="border border-[#E5E7EB] rounded-xl px-4 py-3 text-sm"
          />
          <button
            type="button"
            onClick={loadReport}
            disabled={loading}
            className="bg-[#111827] text-white font-black rounded-xl px-4 py-3 text-sm disabled:opacity-60"
          >
            {loading ? "Generating…" : "Generate Report"}
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      <div className="bg-white rounded-3xl border border-[#E5E7EB] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px] text-left">
            <thead className="bg-[#F8FAFC] border-b border-[#E5E7EB]">
              <tr>
                {columns.map((col) => (
                  <th key={col} className="p-4 text-xs font-bold text-[#9CA3AF] uppercase">
                    {col.replace(/_/g, " ")}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr>
                  <td colSpan={Math.max(columns.length, 1)} className="p-8 text-center text-sm text-[#6B7280]">
                    Select a report type and click Generate Report.
                  </td>
                </tr>
              )}
              {rows.map((row, i) => (
                <tr key={i} className="border-b border-[#E5E7EB] last:border-0">
                  {columns.map((col) => (
                    <td key={col} className="p-4 text-sm text-[#111827]">
                      {formatCell(col, row[col])}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AdminShell>
  );
}
