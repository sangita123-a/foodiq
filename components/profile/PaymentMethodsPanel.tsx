"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CreditCard, Plus, Trash2, Star, Wallet, Smartphone } from "lucide-react";
import useSWR from "swr";
import api from "@/services/api";
import { useToast } from "@/contexts/ToastContext";

const TYPE_LABELS: Record<string, string> = {
  credit_card: "Credit Card",
  debit_card: "Debit Card",
  upi: "UPI",
  wallet: "Wallet",
  cod: "Cash on Delivery",
};

export default function PaymentMethodsPanel() {
  const { data, mutate, isLoading } = useSWR("/api/payment-methods");
  const { data: historyData } = useSWR("/api/payments/history");
  const methods = data || [];
  const history = historyData || [];
  const { showToast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    type: "credit_card",
    card_holder_name: "",
    card_number: "",
    card_brand: "Visa",
    card_expiry: "",
    upi_id: "",
    wallet_name: "PhonePe",
    is_default: false,
  });

  const resetForm = () => {
    setForm({
      type: "credit_card",
      card_holder_name: "",
      card_number: "",
      card_brand: "Visa",
      card_expiry: "",
      upi_id: "",
      wallet_name: "PhonePe",
      is_default: false,
    });
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post("/api/payment-methods", form);
      mutate();
      setShowForm(false);
      resetForm();
      showToast("Payment method added", "success");
    } catch (err: any) {
      showToast(err.response?.data?.message || "Failed to add payment method", "error");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/api/payment-methods/${id}`);
      mutate();
      showToast("Payment method removed", "success");
    } catch (err: any) {
      showToast(err.response?.data?.message || "Failed to remove", "error");
    }
  };

  const handleDefault = async (id: string) => {
    try {
      await api.put(`/api/payment-methods/${id}/default`);
      mutate();
      showToast("Default updated", "success");
    } catch (err: any) {
      showToast(err.response?.data?.message || "Failed to set default", "error");
    }
  };

  if (isLoading) {
    return (
      <div className="bg-[#F8FAFC] rounded-[24px] p-6 md:p-8 border border-[#E5E7EB]">
        <div className="h-8 w-48 bg-[#F8FAFC] animate-pulse rounded mb-8" />
        <div className="h-40 bg-[#F8FAFC] animate-pulse rounded-2xl" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="bg-[#F8FAFC] rounded-[24px] p-6 md:p-8 border border-[#E5E7EB]"
    >
      <div className="flex items-center justify-between mb-8 pb-6 border-b border-[#E5E7EB]">
        <div className="flex items-center gap-3">
          <CreditCard className="w-6 h-6 text-primary" />
          <h2 className="text-2xl font-bold text-[#111827]">Payment Methods</h2>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-primary hover:bg-[#E76F0B] text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" /> Add Method
        </button>
      </div>

      {methods.length === 0 ? (
        <div className="text-center py-12 text-[#6B7280] mb-8">
          <CreditCard className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p className="mb-4">No saved payment methods yet.</p>
          <button
            onClick={() => setShowForm(true)}
            className="text-primary font-bold text-sm"
          >
            Add your first method →
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
          {methods.map((m: any) => (
            <div
              key={m.id}
              className="bg-white border border-[#E5E7EB] rounded-2xl p-5 relative"
            >
              {m.is_default && (
                <span className="absolute top-3 right-3 text-[10px] font-bold uppercase bg-primary/20 text-primary px-2 py-0.5 rounded">
                  Default
                </span>
              )}
              <div className="flex items-center gap-3 mb-3">
                {m.type === "upi" ? (
                  <Smartphone className="w-5 h-5 text-[#6B7280]" />
                ) : m.type === "wallet" || m.type === "cod" ? (
                  <Wallet className="w-5 h-5 text-[#6B7280]" />
                ) : (
                  <CreditCard className="w-5 h-5 text-[#6B7280]" />
                )}
                <h3 className="text-white font-bold">{TYPE_LABELS[m.type] || m.type}</h3>
              </div>
              <p className="text-[#6B7280] text-sm mb-4">
                {m.type === "upi" && m.upi_id}
                {(m.type === "credit_card" || m.type === "debit_card") &&
                  `${m.card_brand || "Card"} •••• ${m.card_last4 || "****"}`}
                {m.type === "wallet" && (m.wallet_name || "Wallet")}
                {m.type === "cod" && "Pay when your order arrives"}
              </p>
              <div className="flex gap-3">
                {!m.is_default && (
                  <button
                    onClick={() => handleDefault(m.id)}
                    className="text-[#6B7280] hover:text-yellow-400 text-sm font-bold flex items-center gap-1"
                  >
                    <Star className="w-4 h-4" /> Default
                  </button>
                )}
                <button
                  onClick={() => handleDelete(m.id)}
                  className="text-[#6B7280] hover:text-red-400 text-sm font-bold flex items-center gap-1"
                >
                  <Trash2 className="w-4 h-4" /> Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <h3 className="text-lg font-bold text-white mb-4">Recent Transactions</h3>
      {history.length === 0 ? (
        <p className="text-[#9CA3AF] text-sm">No payment history yet.</p>
      ) : (
        <div className="space-y-3">
          {history.slice(0, 5).map((p: any) => (
            <div
              key={p.id}
              className="bg-white rounded-xl px-4 py-3 flex justify-between items-center border border-[#E5E7EB]"
            >
              <div>
                <p className="text-white text-sm font-bold">
                  {(p.method || "").replace(/_/g, " ")}
                </p>
                <p className="text-[#9CA3AF] text-xs">
                  {new Date(p.created_at).toLocaleString()}
                </p>
              </div>
              <div className="text-right">
                <p className="text-white font-bold">₹{parseFloat(p.amount).toFixed(2)}</p>
                <p className="text-xs text-green-400 capitalize">{p.status}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/70 flex items-center justify-center p-4"
            onClick={() => setShowForm(false)}
          >
            <motion.form
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              onSubmit={handleAdd}
              className="bg-[#F8FAFC] border border-[#E5E7EB] rounded-2xl p-6 w-full max-w-md space-y-4"
            >
              <h3 className="text-xl font-bold text-[#111827]">Add Payment Method</h3>
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
                className="w-full bg-white text-[#111827] border border-[#E5E7EB] rounded-xl px-4 py-3"
              >
                <option value="credit_card">Credit Card</option>
                <option value="debit_card">Debit Card</option>
                <option value="upi">UPI</option>
                <option value="wallet">Wallet</option>
                <option value="cod">Cash on Delivery</option>
              </select>

              {(form.type === "credit_card" || form.type === "debit_card") && (
                <>
                  <input
                    required
                    placeholder="Cardholder Name"
                    value={form.card_holder_name}
                    onChange={(e) => setForm({ ...form, card_holder_name: e.target.value })}
                    className="w-full bg-white text-[#111827] border border-[#E5E7EB] rounded-xl px-4 py-3"
                  />
                  <input
                    required
                    placeholder="Card Number"
                    value={form.card_number}
                    onChange={(e) => setForm({ ...form, card_number: e.target.value })}
                    className="w-full bg-white text-[#111827] border border-[#E5E7EB] rounded-xl px-4 py-3"
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      required
                      placeholder="MM/YY"
                      value={form.card_expiry}
                      onChange={(e) => setForm({ ...form, card_expiry: e.target.value })}
                      className="w-full bg-white text-[#111827] border border-[#E5E7EB] rounded-xl px-4 py-3"
                    />
                    <select
                      value={form.card_brand}
                      onChange={(e) => setForm({ ...form, card_brand: e.target.value })}
                      className="w-full bg-white text-[#111827] border border-[#E5E7EB] rounded-xl px-4 py-3"
                    >
                      <option>Visa</option>
                      <option>Mastercard</option>
                      <option>RuPay</option>
                      <option>Amex</option>
                    </select>
                  </div>
                </>
              )}

              {form.type === "upi" && (
                <input
                  required
                  placeholder="yourname@upi"
                  value={form.upi_id}
                  onChange={(e) => setForm({ ...form, upi_id: e.target.value })}
                  className="w-full bg-white text-[#111827] border border-[#E5E7EB] rounded-xl px-4 py-3"
                />
              )}

              {form.type === "wallet" && (
                <select
                  value={form.wallet_name}
                  onChange={(e) => setForm({ ...form, wallet_name: e.target.value })}
                  className="w-full bg-white text-[#111827] border border-[#E5E7EB] rounded-xl px-4 py-3"
                >
                  <option>PhonePe</option>
                  <option>Google Pay</option>
                  <option>Paytm</option>
                  <option>Amazon Pay</option>
                </select>
              )}

              <label className="flex items-center gap-2 text-[#6B7280] text-sm">
                <input
                  type="checkbox"
                  checked={form.is_default}
                  onChange={(e) => setForm({ ...form, is_default: e.target.checked })}
                />
                Set as default
              </label>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 bg-[#F8FAFC] text-white py-3 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-primary text-white py-3 rounded-xl font-bold"
                >
                  Save
                </button>
              </div>
            </motion.form>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
