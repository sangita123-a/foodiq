"use client";

import AdminShell from "@/components/admin/AdminShell";
import { useAdminList } from "@/hooks/useAdminData";
import { Bot } from "lucide-react";

type AiStats = {
  sessions: number;
  open_sessions: number;
  forecast_runs: number;
  ai_assistants_enabled: string;
};

export default function AdminAiPage() {
  const { data, isLoading } = useAdminList<AiStats>("/api/admin/v4/ai");

  return (
    <AdminShell title="AI Assistants">
      <div className="mb-6 flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <Bot className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-black text-foreground">AI Assistants</h1>
          <p className="text-gray-text">
            Voice, chatbot, and forecast foundation stats (Foodiq 4.0).
          </p>
        </div>
      </div>

      {isLoading && <p className="text-sm text-gray-text mb-4">Loading…</p>}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Chat sessions", value: data?.sessions ?? "—" },
          { label: "Open sessions", value: data?.open_sessions ?? "—" },
          { label: "Forecast runs", value: data?.forecast_runs ?? "—" },
          {
            label: "AI enabled",
            value: data?.ai_assistants_enabled ?? "false",
          },
        ].map((k) => (
          <div
            key={k.label}
            className="bg-white rounded-3xl border border-border p-5"
          >
            <p className="text-xs font-bold text-[#9CA3AF] uppercase tracking-wider">
              {k.label}
            </p>
            <p className="text-2xl font-black text-foreground mt-1">{k.value}</p>
          </div>
        ))}
      </div>
    </AdminShell>
  );
}
