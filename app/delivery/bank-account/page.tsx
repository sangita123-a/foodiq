"use client";

import { useCallback, useEffect, useState } from "react";
import { CheckCircle2, Clock, Landmark, Pencil, ShieldAlert, XCircle } from "lucide-react";
import DeliveryShell from "@/components/delivery/DeliveryShell";
import { useToast } from "@/contexts/ToastContext";
import {
  addDeliveryBankAccount,
  fetchDeliveryBankAccount,
  updateDeliveryBankAccount,
  type DeliveryBankAccount,
  type DeliveryBankAccountInput,
} from "@/services/deliveryApi";

const STATUS_BADGE: Record<string, string> = {
  approved: "bg-green-50 text-green-600 border-green-200",
  pending: "bg-amber-50 text-amber-600 border-amber-200",
  rejected: "bg-red-50 text-red-600 border-red-200",
};

function StatusBadge({ status }: { status: string }) {
  const icon =
    status === "approved" ? (
      <CheckCircle2 className="w-3.5 h-3.5" />
    ) : status === "rejected" ? (
      <XCircle className="w-3.5 h-3.5" />
    ) : (
      <Clock className="w-3.5 h-3.5" />
    );
  return (
    <span
      className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full border ${
        STATUS_BADGE[status] || STATUS_BADGE.pending
      }`}
    >
      {icon}
      {status}
    </span>
  );
}

const emptyForm: DeliveryBankAccountInput = {
  account_holder_name: "",
  account_number: "",
  confirm_account_number: "",
  bank_name: "",
  ifsc_code: "",
  account_type: "savings",
  upi_id: "",
};

export default function DeliveryBankAccountPage() {
  const { showToast } = useToast();
  const [account, setAccount] = useState<DeliveryBankAccount | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<DeliveryBankAccountInput>(emptyForm);

  const load = useCallback(async () => {
    try {
      const data = await fetchDeliveryBankAccount();
      setAccount(data);
      setEditing(!data);
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { message?: string } } };
      showToast(ax.response?.data?.message || "Failed to load bank account", "error");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    load();
  }, [load]);

  const startEdit = () => {
    setForm({
      account_holder_name: account?.account_holder_name || "",
      account_number: "",
      confirm_account_number: "",
      bank_name: account?.bank_name || "",
      ifsc_code: account?.ifsc_code || "",
      account_type: account?.account_type || "savings",
      upi_id: account?.upi_id || "",
    });
    setEditing(true);
  };

  const field = (key: keyof DeliveryBankAccountInput) => ({
    value: form[key] || "",
    onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value })),
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.account_number !== form.confirm_account_number) {
      showToast("Account number and confirmation do not match", "error");
      return;
    }
    setSaving(true);
    try {
      const payload = { ...form, ifsc_code: form.ifsc_code.trim().toUpperCase() };
      const saved = account
        ? await updateDeliveryBankAccount(account.id, payload)
        : await addDeliveryBankAccount(payload);
      setAccount(saved);
      setEditing(false);
      showToast("Bank account saved. It will be reviewed before you can withdraw.", "success");
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { message?: string } } };
      showToast(ax.response?.data?.message || "Failed to save bank account", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <DeliveryShell title="Bank Account">
      <div className="max-w-2xl space-y-6">
        <div>
          <h1 className="text-2xl font-black text-foreground">Bank Account &amp; Payout</h1>
          <p className="text-sm text-gray-text mt-1">
            Add and manage the bank account used for your withdrawal payouts. Your account details
            are encrypted and never fully displayed.
          </p>
        </div>

        {loading ? (
          <div className="h-64 rounded-2xl bg-section animate-pulse" />
        ) : !editing && account ? (
          <div className="bg-white border border-border rounded-2xl p-6 space-y-5">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <Landmark className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-black text-foreground">{account.bank_name}</p>
                  <p className="text-xs text-gray-text">{account.account_holder_name}</p>
                </div>
              </div>
              <StatusBadge status={account.verification_status} />
            </div>

            {account.verification_status === "rejected" && account.rejection_reason && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                <span className="font-bold">Rejected: </span>
                {account.rejection_reason}
              </div>
            )}

            {account.verification_status === "pending" && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 flex items-start gap-2">
                <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                Your bank account is awaiting admin verification. You can withdraw once it is
                approved.
              </div>
            )}

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-[11px] font-bold text-gray-text uppercase">Account Number</p>
                <p className="font-bold text-foreground mt-0.5">{account.account_number_masked}</p>
              </div>
              <div>
                <p className="text-[11px] font-bold text-gray-text uppercase">IFSC Code</p>
                <p className="font-bold text-foreground mt-0.5">{account.ifsc_code}</p>
              </div>
              <div>
                <p className="text-[11px] font-bold text-gray-text uppercase">Account Type</p>
                <p className="font-bold text-foreground mt-0.5 capitalize">{account.account_type}</p>
              </div>
              <div>
                <p className="text-[11px] font-bold text-gray-text uppercase">UPI ID</p>
                <p className="font-bold text-foreground mt-0.5">{account.upi_id || "—"}</p>
              </div>
            </div>

            <button
              type="button"
              onClick={startEdit}
              className="w-full flex items-center justify-center gap-2 border border-border hover:bg-section text-foreground text-sm font-bold py-2.5 rounded-xl"
            >
              <Pencil className="w-4 h-4" />
              Edit Bank Account
            </button>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="bg-white border border-border rounded-2xl p-6 space-y-4"
          >
            <label className="block">
              <span className="text-[11px] font-bold text-gray-text uppercase">
                Account Holder Name
              </span>
              <input
                {...field("account_holder_name")}
                required
                placeholder="As per bank records"
                className="mt-1 w-full border border-border rounded-xl px-3 py-2.5 text-sm"
              />
            </label>

            <label className="block">
              <span className="text-[11px] font-bold text-gray-text uppercase">Bank Name</span>
              <input
                {...field("bank_name")}
                required
                placeholder="e.g. State Bank of India"
                className="mt-1 w-full border border-border rounded-xl px-3 py-2.5 text-sm"
              />
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="block">
                <span className="text-[11px] font-bold text-gray-text uppercase">
                  Account Number
                </span>
                <input
                  {...field("account_number")}
                  required={!account}
                  type="text"
                  inputMode="numeric"
                  placeholder={account ? "Leave blank to keep current" : "9-18 digit account number"}
                  className="mt-1 w-full border border-border rounded-xl px-3 py-2.5 text-sm"
                />
              </label>
              <label className="block">
                <span className="text-[11px] font-bold text-gray-text uppercase">
                  Confirm Account Number
                </span>
                <input
                  {...field("confirm_account_number")}
                  required={!!form.account_number}
                  type="text"
                  inputMode="numeric"
                  placeholder="Re-enter account number"
                  className="mt-1 w-full border border-border rounded-xl px-3 py-2.5 text-sm"
                />
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="block">
                <span className="text-[11px] font-bold text-gray-text uppercase">IFSC Code</span>
                <input
                  {...field("ifsc_code")}
                  required
                  placeholder="e.g. SBIN0001234"
                  className="mt-1 w-full border border-border rounded-xl px-3 py-2.5 text-sm uppercase"
                  maxLength={11}
                />
              </label>
              <label className="block">
                <span className="text-[11px] font-bold text-gray-text uppercase">
                  Account Type
                </span>
                <select
                  value={form.account_type}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      account_type: e.target.value as DeliveryBankAccountInput["account_type"],
                    }))
                  }
                  className="mt-1 w-full border border-border rounded-xl px-3 py-2.5 text-sm bg-white"
                >
                  <option value="savings">Savings</option>
                  <option value="current">Current</option>
                </select>
              </label>
            </div>

            <label className="block">
              <span className="text-[11px] font-bold text-gray-text uppercase">
                UPI ID (optional)
              </span>
              <input
                {...field("upi_id")}
                placeholder="e.g. name@bank"
                className="mt-1 w-full border border-border rounded-xl px-3 py-2.5 text-sm"
              />
            </label>

            <div className="flex gap-3 pt-2">
              {account && (
                <button
                  type="button"
                  onClick={() => setEditing(false)}
                  className="flex-1 border border-border text-foreground text-sm font-bold py-2.5 rounded-xl"
                >
                  Cancel
                </button>
              )}
              <button
                type="submit"
                disabled={saving}
                className="flex-1 bg-primary hover:bg-primary-hover text-white text-sm font-bold py-2.5 rounded-xl disabled:opacity-60"
              >
                {saving ? "Saving..." : account ? "Update Bank Account" : "Save Bank Account"}
              </button>
            </div>
          </form>
        )}
      </div>
    </DeliveryShell>
  );
}
