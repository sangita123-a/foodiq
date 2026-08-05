"use client";

import { useState } from "react";
import { mutate } from "swr";
import AdminShell from "@/components/admin/AdminShell";
import { useAdminList } from "@/hooks/useAdminData";
import { adminPost, adminPut, adminDelete, formatDate } from "@/services/adminApi";
import { ADMIN_ROLE_LABELS, type AdminRole } from "@/lib/adminPermissions";
import { Button, EmptyState, SkeletonRows } from "@/components/admin/ui";
import { Users } from "lucide-react";

type StaffRow = {
  id: string;
  email: string;
  full_name: string;
  phone_number?: string;
  admin_role: AdminRole;
  created_at?: string;
};

const ROLES: AdminRole[] = [
  "super_admin",
  "admin",
  "support_executive",
  "finance_manager",
  "marketing_manager",
];

export default function AdminStaffPage() {
  const { data, isLoading } = useAdminList<StaffRow[]>("/api/admin/staff");
  const staff = data || [];
  const [form, setForm] = useState({
    email: "",
    password: "",
    full_name: "",
    phone_number: "",
    admin_role: "admin" as AdminRole,
  });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setMsg("");
    try {
      await adminPost("/api/admin/staff", form);
      setForm({ email: "", password: "", full_name: "", phone_number: "", admin_role: "admin" });
      mutate("/api/admin/staff");
      setMsg("Admin staff member created.");
    } catch {
      setMsg("Failed to create staff member.");
    } finally {
      setBusy(false);
    }
  };

  const updateRole = async (id: string, admin_role: AdminRole) => {
    await adminPut(`/api/admin/staff/${id}`, { admin_role });
    mutate("/api/admin/staff");
  };

  const remove = async (id: string) => {
    if (!confirm("Remove this admin staff member?")) return;
    await adminDelete(`/api/admin/staff/${id}`);
    mutate("/api/admin/staff");
  };

  return (
    <AdminShell title="Admin Staff">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-black text-foreground tracking-tight mb-1.5">Admin Staff Management</h1>
        <p className="text-gray-text text-sm">Create and manage platform admin users with role-based access.</p>
      </div>

      {msg && (
        <div className="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
          {msg}
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <form
          onSubmit={create}
          className="bg-white rounded-2xl border border-border shadow-[var(--shadow-admin-soft)] p-5 sm:p-6 space-y-4 h-fit"
        >
          <h2 className="text-lg font-black text-foreground tracking-tight">Add Admin User</h2>
          <input
            value={form.full_name}
            onChange={(e) => setForm({ ...form, full_name: e.target.value })}
            placeholder="Full name"
            required
            className="w-full border border-border rounded-xl px-4 py-3 text-sm"
          />
          <input
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="Email"
            required
            className="w-full border border-border rounded-xl px-4 py-3 text-sm"
          />
          <input
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            placeholder="Password"
            required
            className="w-full border border-border rounded-xl px-4 py-3 text-sm"
          />
          <input
            value={form.phone_number}
            onChange={(e) => setForm({ ...form, phone_number: e.target.value })}
            placeholder="Phone (optional)"
            className="w-full border border-border rounded-xl px-4 py-3 text-sm"
          />
          <select
            value={form.admin_role}
            onChange={(e) => setForm({ ...form, admin_role: e.target.value as AdminRole })}
            className="w-full border border-border rounded-xl px-4 py-3 text-sm"
          >
            {ROLES.map((r) => (
              <option key={r} value={r}>{ADMIN_ROLE_LABELS[r]}</option>
            ))}
          </select>
          <Button type="submit" variant="primary" loading={busy} className="w-full justify-center">
            Create Admin
          </Button>
        </form>

        <div className="xl:col-span-2 bg-white rounded-2xl border border-border shadow-[var(--shadow-admin-soft)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px] text-left">
              <thead className="bg-section border-b border-border">
                <tr>
                  {["Name", "Email", "Role", "Created", "Actions"].map((h) => (
                    <th key={h} className="p-4 text-xs font-bold text-[#9CA3AF] uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {isLoading && !data ? (
                  <SkeletonRows rows={4} columns={5} />
                ) : (
                  staff.map((s) => (
                    <tr key={s.id} className="border-b border-border last:border-0 hover:bg-section/50">
                      <td className="p-4 font-bold text-sm text-foreground">{s.full_name}</td>
                      <td className="p-4 text-sm text-gray-text">{s.email}</td>
                      <td className="p-4">
                        <select
                          value={s.admin_role || "admin"}
                          onChange={(e) => updateRole(s.id, e.target.value as AdminRole)}
                          className="border border-border rounded-lg px-2 py-1 text-xs font-bold"
                        >
                          {ROLES.map((r) => (
                            <option key={r} value={r}>{ADMIN_ROLE_LABELS[r]}</option>
                          ))}
                        </select>
                      </td>
                      <td className="p-4 text-xs text-[#9CA3AF]">{formatDate(s.created_at)}</td>
                      <td className="p-4">
                        <button type="button" onClick={() => remove(s.id)} className="text-xs font-bold text-red-500 hover:text-red-600">
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {!isLoading && staff.length === 0 && (
            <EmptyState icon={Users} title="No admin staff yet" description="Add your first admin user using the form on the left." />
          )}
        </div>
      </div>
    </AdminShell>
  );
}
