"use client";

import AdminShell from "@/components/admin/AdminShell";
import { useAdminList } from "@/hooks/useAdminData";
import StatCard from "@/components/admin/dashboard/StatCard";
import { Bot, MessageSquare, Clock, TrendingUp, Sparkles } from "lucide-react";

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
          <h1 className="text-2xl md:text-3xl font-black text-foreground tracking-tight">AI Assistants</h1>
          <p className="text-gray-text">
            Voice, chatbot, and forecast foundation stats (Foodiq 4.0).
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Chat Sessions"
          value={data?.sessions ?? 0}
          icon={MessageSquare}
          color="text-sky-600"
          bg="bg-sky-500/10"
          loading={isLoading && !data}
        />
        <StatCard
          label="Open Sessions"
          value={data?.open_sessions ?? 0}
          icon={Clock}
          color="text-amber-600"
          bg="bg-amber-500/10"
          loading={isLoading && !data}
        />
        <StatCard
          label="Forecast Runs"
          value={data?.forecast_runs ?? 0}
          icon={TrendingUp}
          color="text-violet-600"
          bg="bg-violet-500/10"
          loading={isLoading && !data}
        />
        <StatCard
          label="AI Enabled"
          value={data?.ai_assistants_enabled === "true" ? 1 : 0}
          icon={Sparkles}
          color="text-emerald-600"
          bg="bg-emerald-500/10"
          format={(n) => (n ? "Enabled" : "Disabled")}
          loading={isLoading && !data}
        />
      </div>
    </AdminShell>
  );
}
