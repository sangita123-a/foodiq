"use client";

import { useMemo, useState } from "react";
import { mutate } from "swr";
import AdminShell from "@/components/admin/AdminShell";
import { useAdminList } from "@/hooks/useAdminData";
import { adminPut, adminDelete, adminGet, formatCurrency, formatDate } from "@/services/adminApi";

type UserRow = {
  id: string;
  email: string;
  full_name: string;
  phone_number?: string;
  role: string;
  is_suspended?: boolean;
  order_count?: number;
  spent?: number;
  created_at?: string;
};

type UserOrder = {
  id: string;
  status: string;
  total_amount: number;
  created_at: string;
  restaurant_name: string;
};

type UserWallet = {
  reward_points: number;
  referral_count: number;
  total_spent: number;
  order_count: number;
};

type ReferralRow = {
  id: string;
  code?: string;
  referee_name?: string;
  referee_email?: string;
  points_awarded?: number;
  status?: string;
  created_at?: string;
};

export default function AdminUsersPage() {
  const [search, setSearch] = useState("");
  const [suspended, setSuspended] = useState("");
  const [ordersUser, setOrdersUser] = useState<UserRow | null>(null);
  const [orders, setOrders] = useState<UserOrder[]>([]);
  const [walletUser, setWalletUser] = useState<UserRow | null>(null);
  const [wallet, setWallet] = useState<UserWallet | null>(null);
  const [referralUser, setReferralUser] = useState<UserRow | null>(null);
  const [referrals, setReferrals] = useState<ReferralRow[]>([]);

  const path = useMemo(() => {
    const q = new URLSearchParams({ role: "customer" });
    if (search) q.set("search", search);
    if (suspended) q.set("suspended", suspended);
    return `/api/admin/users?${q.toString()}`;
  }, [search, suspended]);

  const { data, isLoading } = useAdminList<UserRow[]>(path);
  const users = data || [];

  const refresh = () => mutate(path);

  const toggleSuspend = async (u: UserRow) => {
    await adminPut(`/api/admin/users/${u.id}`, { is_suspended: !u.is_suspended });
    refresh();
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this customer account?")) return;
    await adminDelete(`/api/admin/users/${id}`);
    refresh();
  };

  const viewOrders = async (u: UserRow) => {
    setOrdersUser(u);
    const list = await adminGet<UserOrder[]>(`/api/admin/users/${u.id}/orders`);
    setOrders(list);
  };

  const viewWallet = async (u: UserRow) => {
    setWalletUser(u);
    const data = await adminGet<UserWallet>(`/api/admin/users/${u.id}/wallet`);
    setWallet(data);
  };

  const viewReferrals = async (u: UserRow) => {
    setReferralUser(u);
    const list = await adminGet<ReferralRow[]>(`/api/admin/users/${u.id}/referrals`);
    setReferrals(list);
  };

  return (
    <AdminShell title="User Management">
      <div className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-foreground">Customers</h1>
          <p className="text-gray-text">Search, suspend, and review customer accounts.</p>
        </div>
        <div className="flex gap-3">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, email, phone…"
            className="bg-white border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary"
          />
          <select
            value={suspended}
            onChange={(e) => setSuspended(e.target.value)}
            className="bg-white border border-border rounded-xl px-4 py-2.5 text-sm"
          >
            <option value="">All accounts</option>
            <option value="false">Active</option>
            <option value="true">Suspended</option>
          </select>
        </div>
      </div>

      {isLoading && <p className="text-sm text-gray-text mb-4">Loading…</p>}

      <div className="bg-white rounded-3xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px] text-left">
            <thead className="bg-section border-b border-border">
              <tr>
                <th className="p-4 text-xs font-bold text-[#9CA3AF] uppercase">Customer</th>
                <th className="p-4 text-xs font-bold text-[#9CA3AF] uppercase">Orders</th>
                <th className="p-4 text-xs font-bold text-[#9CA3AF] uppercase">Spent</th>
                <th className="p-4 text-xs font-bold text-[#9CA3AF] uppercase">Status</th>
                <th className="p-4 text-xs font-bold text-[#9CA3AF] uppercase text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-border">
                  <td className="p-4">
                    <p className="font-bold text-foreground">{u.full_name}</p>
                    <p className="text-xs text-gray-text">{u.email}</p>
                    <p className="text-xs text-[#9CA3AF]">{u.phone_number || "—"}</p>
                  </td>
                  <td className="p-4 font-bold">{u.order_count || 0}</td>
                  <td className="p-4 font-bold text-green-600">{formatCurrency(u.spent || 0)}</td>
                  <td className="p-4">
                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${u.is_suspended ? "bg-red-50 text-red-600" : "bg-green-50 text-green-600"}`}>
                      {u.is_suspended ? "Suspended" : "Active"}
                    </span>
                    <p className="text-[10px] text-[#9CA3AF] mt-1">{formatDate(u.created_at)}</p>
                  </td>
                  <td className="p-4 text-right space-x-2">
                    <button type="button" onClick={() => viewOrders(u)} className="text-xs font-bold text-foreground">Orders</button>
                    <button type="button" onClick={() => viewWallet(u)} className="text-xs font-bold text-foreground">Wallet</button>
                    <button type="button" onClick={() => viewReferrals(u)} className="text-xs font-bold text-foreground">Referrals</button>
                    <button type="button" onClick={() => toggleSuspend(u)} className="text-xs font-bold text-primary">
                      {u.is_suspended ? "Activate" : "Suspend"}
                    </button>
                    <button type="button" onClick={() => remove(u.id)} className="text-xs font-bold text-red-500">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!users.length && !isLoading && <p className="text-center py-16 text-[#9CA3AF]">No users found.</p>}
        </div>
      </div>

      {ordersUser && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={() => setOrdersUser(null)}>
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-black text-foreground mb-1">Orders — {ordersUser.full_name}</h3>
            <p className="text-sm text-gray-text mb-4">{ordersUser.email}</p>
            <div className="space-y-2">
              {orders.map((o) => (
                <div key={o.id} className="border border-border rounded-xl p-3 flex justify-between">
                  <div>
                    <p className="font-mono text-xs text-primary">#{String(o.id).slice(0, 8)}</p>
                    <p className="text-sm font-bold">{o.restaurant_name}</p>
                    <p className="text-xs text-gray-text">{formatDate(o.created_at)}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-black">{formatCurrency(o.total_amount)}</p>
                    <p className="text-xs text-gray-text">{o.status}</p>
                  </div>
                </div>
              ))}
              {!orders.length && <p className="text-sm text-gray-text">No orders.</p>}
            </div>
            <button type="button" onClick={() => setOrdersUser(null)} className="mt-4 w-full py-3 rounded-xl bg-section border border-border font-bold">
              Close
            </button>
          </div>
        </div>
      )}

      {walletUser && wallet && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={() => setWalletUser(null)}>
          <div className="bg-white rounded-3xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-black text-foreground mb-1">Wallet — {walletUser.full_name}</h3>
            <div className="grid grid-cols-2 gap-3 mt-4">
              <div className="bg-section rounded-xl p-4 border border-border">
                <p className="text-xs text-[#9CA3AF] font-bold uppercase">Reward Points</p>
                <p className="text-2xl font-black">{wallet.reward_points}</p>
              </div>
              <div className="bg-section rounded-xl p-4 border border-border">
                <p className="text-xs text-[#9CA3AF] font-bold uppercase">Referrals</p>
                <p className="text-2xl font-black">{wallet.referral_count}</p>
              </div>
              <div className="bg-section rounded-xl p-4 border border-border">
                <p className="text-xs text-[#9CA3AF] font-bold uppercase">Total Spent</p>
                <p className="text-xl font-black">{formatCurrency(wallet.total_spent)}</p>
              </div>
              <div className="bg-section rounded-xl p-4 border border-border">
                <p className="text-xs text-[#9CA3AF] font-bold uppercase">Orders</p>
                <p className="text-2xl font-black">{wallet.order_count}</p>
              </div>
            </div>
            <button type="button" onClick={() => setWalletUser(null)} className="mt-4 w-full py-3 rounded-xl bg-section border border-border font-bold">
              Close
            </button>
          </div>
        </div>
      )}

      {referralUser && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={() => setReferralUser(null)}>
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-black text-foreground mb-1">Referral History — {referralUser.full_name}</h3>
            <div className="space-y-2 mt-4">
              {referrals.map((r) => (
                <div key={r.id} className="border border-border rounded-xl p-3 flex justify-between">
                  <div>
                    <p className="text-sm font-bold">{r.referee_name || r.referee_email || "User"}</p>
                    <p className="text-xs text-gray-text">Code: {r.code}</p>
                    <p className="text-xs text-[#9CA3AF]">{formatDate(r.created_at)}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-black text-primary">+{r.points_awarded || 0} pts</p>
                    <p className="text-xs text-gray-text">{r.status}</p>
                  </div>
                </div>
              ))}
              {!referrals.length && <p className="text-sm text-gray-text">No referrals yet.</p>}
            </div>
            <button type="button" onClick={() => setReferralUser(null)} className="mt-4 w-full py-3 rounded-xl bg-section border border-border font-bold">
              Close
            </button>
          </div>
        </div>
      )}
    </AdminShell>
  );
}
