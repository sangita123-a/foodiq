"use client";

import { useState } from "react";
import AdminShell from "@/components/admin/AdminShell";
import { useAdminList } from "@/hooks/useAdminData";
import { formatDate } from "@/services/adminApi";
import { Badge, SkeletonRows } from "@/components/admin/ui";

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
        <h1 className="text-2xl md:text-3xl font-black text-foreground tracking-tight mb-1.5">Security & Compliance</h1>
        <p className="text-gray-text text-sm">Role-based access control, audit logs, and admin login history.</p>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        {([
          ["rbac", "Role Permissions"],
          ["audit", "Audit Logs"],
          ["logins", "Admin Login Logs"],
        ] as const).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors ${
              tab === id
                ? "bg-primary text-white shadow-[var(--shadow-button)]"
                : "bg-white border border-border text-gray-text hover:bg-section"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "rbac" && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {isLoading && !data
            ? Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="bg-white rounded-2xl border border-border shadow-[var(--shadow-admin-soft)] p-5 h-32 animate-pulse" />
              ))
            : (data?.roles || []).map((role) => (
                <div
                  key={role.id}
                  className="bg-white rounded-2xl border border-border shadow-[var(--shadow-admin-soft)] p-5"
                >
                  <h3 className="font-black text-foreground tracking-tight mb-1">{role.label}</h3>
                  <p className="text-xs text-[#9CA3AF] mb-3 font-mono">{role.id}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {role.permissions.map((p) => (
                      <span
                        key={p}
                        className="text-[10px] font-bold bg-section text-gray-text px-2 py-1 rounded-full"
                      >
                        {p}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
        </div>
      )}

      {tab === "audit" && (
        <div className="bg-white rounded-2xl border border-border shadow-[var(--shadow-admin-soft)] overflow-hidden">
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
                {isLoading && !data ? (
                  <SkeletonRows rows={5} columns={6} />
                ) : (
                  (data?.audit_logs || []).map((log) => (
                    <tr key={log.id} className="border-b border-border last:border-0 hover:bg-section/50">
                      <td className="p-4 text-xs text-gray-text">{formatDate(log.created_at)}</td>
                      <td className="p-4 text-sm font-bold text-foreground">{log.action}</td>
                      <td className="p-4 text-xs text-gray-text">{log.category}</td>
                      <td className="p-4 text-sm">{log.full_name || log.email || "—"}</td>
                      <td className="p-4">
                        <Badge tone={log.status === "success" ? "success" : "error"}>{log.status}</Badge>
                      </td>
                      <td className="p-4 text-xs text-gray-text max-w-[200px] truncate">{log.message}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === "logins" && (
        <div className="bg-white rounded-2xl border border-border shadow-[var(--shadow-admin-soft)] overflow-hidden">
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
                {isLoading && !data ? (
                  <SkeletonRows rows={5} columns={6} />
                ) : (
                  (data?.login_logs || []).map((log) => (
                    <tr key={log.id} className="border-b border-border last:border-0 hover:bg-section/50">
                      <td className="p-4 text-xs text-gray-text">{formatDate(log.created_at)}</td>
                      <td className="p-4 text-sm font-bold text-foreground">{log.full_name || log.email}</td>
                      <td className="p-4 text-xs text-gray-text">{log.admin_role || "admin"}</td>
                      <td className="p-4 text-xs font-mono">{log.ip_address || "—"}</td>
                      <td className="p-4 text-xs">{log.device_name || "—"}</td>
                      <td className="p-4">
                        <Badge tone={log.status === "success" ? "success" : "error"}>{log.status}</Badge>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </AdminShell>
  );
}
