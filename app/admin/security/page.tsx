"use client";

import { useState } from "react";
import AdminShell from "@/components/admin/AdminShell";
import { useAdminList } from "@/hooks/useAdminData";
import { formatDate } from "@/services/adminApi";

type RoleInfo = {
  id: string;
  label: string;
  permissions: string[];
};

type LoginLog = {
  id: string;
  email?: string;
  full_name?: string;
  admin_role?: string;
  ip_address?: string;
  device_name?: string;
  status?: string;
  created_at?: string;
};

type AuditLog = {
  id: string;
  action: string;
  category?: string;
  status?: string;
  message?: string;
  email?: string;
  full_name?: string;
  created_at?: string;
};

type SecurityData = {
  roles: RoleInfo[];
  login_logs: LoginLog[];
  audit_logs: AuditLog[];
};

export default function AdminSecurityPage() {
  const { data, isLoading } = useAdminList<SecurityData>("/api/admin/security");
  const [tab, setTab] = useState<"rbac" | "audit" | "logins">("rbac");

  return (
    <AdminShell title="Security">
      <div className="mb-6">
        <h1 className="text-3xl font-black text-foreground">Security & Compliance</h1>
        <p className="text-gray-text">Role-based access control, audit logs, and admin login history.</p>
      </div>

      <div className="flex gap-2 mb-6">
        {([
          ["rbac", "Role Permissions"],
          ["audit", "Audit Logs"],
          ["logins", "Admin Login Logs"],
        ] as const).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`px-4 py-2 rounded-xl text-sm font-bold ${
              tab === id ? "bg-primary text-white" : "bg-white border border-border text-gray-text"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {isLoading && <p className="text-sm text-gray-text">Loading…</p>}

      {tab === "rbac" && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {(data?.roles || []).map((role) => (
            <div key={role.id} className="bg-white rounded-2xl border border-border p-5">
              <h3 className="font-black text-foreground mb-1">{role.label}</h3>
              <p className="text-xs text-[#9CA3AF] mb-3 font-mono">{role.id}</p>
              <div className="flex flex-wrap gap-1">
                {role.permissions.map((p) => (
                  <span key={p} className="text-[10px] font-bold bg-section text-gray-text px-2 py-0.5 rounded">
                    {p}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === "audit" && (
        <div className="bg-white rounded-3xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-left">
              <thead className="bg-section border-b border-border">
                <tr>
                  {["Time", "Action", "Category", "User", "Status", "Message"].map((h) => (
                    <th key={h} className="p-4 text-xs font-bold text-[#9CA3AF] uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(data?.audit_logs || []).map((log) => (
                  <tr key={log.id} className="border-b border-border last:border-0">
                    <td className="p-4 text-xs text-gray-text">{formatDate(log.created_at)}</td>
                    <td className="p-4 text-sm font-bold text-foreground">{log.action}</td>
                    <td className="p-4 text-xs text-gray-text">{log.category}</td>
                    <td className="p-4 text-sm">{log.full_name || log.email || "—"}</td>
                    <td className="p-4">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                        log.status === "success" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
                      }`}>
                        {log.status}
                      </span>
                    </td>
                    <td className="p-4 text-xs text-gray-text max-w-[200px] truncate">{log.message}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === "logins" && (
        <div className="bg-white rounded-3xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-left">
              <thead className="bg-section border-b border-border">
                <tr>
                  {["Time", "Admin", "Role", "IP", "Device", "Status"].map((h) => (
                    <th key={h} className="p-4 text-xs font-bold text-[#9CA3AF] uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(data?.login_logs || []).map((log) => (
                  <tr key={log.id} className="border-b border-border last:border-0">
                    <td className="p-4 text-xs text-gray-text">{formatDate(log.created_at)}</td>
                    <td className="p-4 text-sm font-bold text-foreground">{log.full_name || log.email}</td>
                    <td className="p-4 text-xs text-gray-text">{log.admin_role || "admin"}</td>
                    <td className="p-4 text-xs font-mono">{log.ip_address || "—"}</td>
                    <td className="p-4 text-xs">{log.device_name || "—"}</td>
                    <td className="p-4">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                        log.status === "success" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
                      }`}>
                        {log.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </AdminShell>
  );
}
