import api from "@/services/api";

export async function fetchMonitoringDashboard() {
  const res = await api.get("/api/monitoring/dashboard");
  return res.data.data;
}

export async function fetchAudits(params: Record<string, string | number | undefined> = {}) {
  const res = await api.get("/api/monitoring/audits", { params });
  return res.data.data as Array<Record<string, unknown>>;
}

export async function fetchErrors(params: Record<string, string | number | undefined> = {}) {
  const res = await api.get("/api/monitoring/errors", { params });
  return res.data.data as Array<Record<string, unknown>>;
}

export async function fetchAlerts(params: Record<string, string | undefined> = {}) {
  const res = await api.get("/api/monitoring/alerts", { params });
  return res.data.data as Array<Record<string, unknown>>;
}

export async function ackAlert(id: string) {
  const res = await api.put(`/api/monitoring/alerts/${id}/ack`);
  return res.data.data;
}

export async function fetchLogFiles() {
  const res = await api.get("/api/monitoring/logs");
  return res.data.data as Array<{ name: string; size: number; modified: string }>;
}

export async function fetchLogContent(name: string, params: Record<string, string | number> = {}) {
  const res = await api.get(`/api/monitoring/logs/${encodeURIComponent(name)}`, { params });
  return res.data.data as Array<Record<string, unknown>>;
}

export async function fetchBackups() {
  const res = await api.get("/api/monitoring/backups");
  return res.data.data as {
    runs: Array<Record<string, unknown>>;
    health: Array<Record<string, unknown>>;
  };
}

export async function reportClientError(payload: {
  message: string;
  stack?: string;
  path?: string;
  meta?: Record<string, unknown>;
}) {
  try {
    const ua = typeof navigator !== "undefined" ? navigator.userAgent : undefined;
    let browser: string | undefined;
    let device: string | undefined;
    if (ua) {
      if (/Edg\//i.test(ua)) browser = "Edge";
      else if (/Chrome\//i.test(ua) && !/Edg\//i.test(ua)) browser = "Chrome";
      else if (/Firefox\//i.test(ua)) browser = "Firefox";
      else if (/Safari\//i.test(ua) && !/Chrome\//i.test(ua)) browser = "Safari";
      else browser = "Other";
      if (/iPad|Tablet/i.test(ua)) device = "Tablet";
      else if (/Mobile|Android|iPhone/i.test(ua)) device = "Mobile";
      else device = "Desktop";
    }
    await api.post(
      "/api/monitoring/client-error",
      {
        ...payload,
        meta: {
          ...(payload.meta || {}),
          browser,
          device,
          user_agent: ua,
        },
      },
      { timeout: 5000 }
    );
  } catch {
    /* swallow — never break UI */
  }
}

export function auditsExportUrl(q = "") {
  const base = process.env.NEXT_PUBLIC_API_URL || "https://foodiq-2.onrender.com";
  return `${base}/api/monitoring/audits/export?q=${encodeURIComponent(q)}`;
}
