"use client";

import { useState, useRef, useEffect } from "react";
import { Download, ChevronDown } from "lucide-react";
import { fetchRestaurantsExportBlob, downloadBlob, type AdminRestaurantFilters } from "@/services/adminApi";
import { useToast } from "@/contexts/ToastContext";
import { Button } from "@/components/admin/ui";

export default function ExportMenu({ filters }: { filters: AdminRestaurantFilters }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { showToast } = useToast();

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const run = async (format: "csv" | "pdf" | "xlsx", filename: string) => {
    setOpen(false);
    setBusy(true);
    try {
      const blob = await fetchRestaurantsExportBlob(filters, format);
      downloadBlob(blob, filename);
      showToast("Export downloaded", "success");
    } catch {
      showToast("Export failed. Please try again.", "error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="relative" ref={ref}>
      <Button variant="secondary" onClick={() => setOpen((v) => !v)} disabled={busy} icon={<Download className="w-4 h-4" />}>
        {busy ? "Exporting…" : "Export"}
        <ChevronDown className="w-3.5 h-3.5" />
      </Button>
      {open && (
        <div className="absolute right-0 mt-2 w-56 bg-white border border-border rounded-2xl shadow-[var(--shadow-admin-lifted)] z-20 overflow-hidden">
          <button
            type="button"
            onClick={() => run("csv", "restaurants-export.csv")}
            className="w-full text-left px-4 py-3 text-sm font-semibold hover:bg-section"
          >
            CSV
          </button>
          <button
            type="button"
            onClick={() => run("xlsx", "restaurants-export.xlsx")}
            className="w-full text-left px-4 py-3 text-sm font-semibold hover:bg-section border-t border-border"
          >
            Excel (.xlsx)
          </button>
          <button
            type="button"
            onClick={() => run("pdf", "restaurants-export.pdf")}
            className="w-full text-left px-4 py-3 text-sm font-semibold hover:bg-section border-t border-border"
          >
            PDF
          </button>
        </div>
      )}
    </div>
  );
}
