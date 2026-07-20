import api from "./api";

export type WalletSummary = {
  balance: number;
  cashback_balance: number;
  refund_balance: number;
  transactions: WalletTransaction[];
};

export type WalletTransaction = {
  id: string;
  user_id?: string;
  type: string;
  category: string;
  amount: number;
  balance_after: number;
  status: string;
  note?: string;
  order_id?: string;
  created_at: string;
};

export type RefundRequest = {
  id: string;
  order_id: string;
  amount: number;
  refund_type: string;
  refund_method: string;
  status: string;
  reason?: string;
  full_name?: string;
  email?: string;
  created_at: string;
};

export const fetchWallet = async (): Promise<WalletSummary> => {
  const res = await api.get("/api/wallet");
  return res.data.data;
};

export const fetchWalletTransactions = async (type = ""): Promise<WalletTransaction[]> => {
  const qs = type ? `?type=${encodeURIComponent(type)}` : "";
  const res = await api.get(`/api/wallet/transactions${qs}`);
  return res.data.data.transactions || [];
};

export const adminFetchWalletTransactions = async (userId?: string) => {
  const qs = userId ? `?user_id=${encodeURIComponent(userId)}` : "";
  const res = await api.get(`/api/wallet/admin/transactions${qs}`);
  return res.data.data.transactions || [];
};

export const adminCreditWallet = async (payload: {
  user_id: string;
  amount: number;
  category?: string;
  note?: string;
}) => {
  const res = await api.post("/api/wallet/admin/credit", payload);
  return res.data.data;
};

export const adminDebitWallet = async (payload: {
  user_id: string;
  amount: number;
  note?: string;
}) => {
  const res = await api.post("/api/wallet/admin/debit", payload);
  return res.data.data;
};

export const adminFetchRefundRequests = async (status = ""): Promise<RefundRequest[]> => {
  const qs = status ? `?status=${encodeURIComponent(status)}` : "";
  const res = await api.get(`/api/wallet/admin/refund-requests${qs}`);
  return res.data.data.requests || [];
};

export const adminApproveRefund = async (id: string) => {
  const res = await api.put(`/api/wallet/admin/refund-requests/${id}/approve`);
  return res.data.data;
};

export const adminRejectRefund = async (id: string, reason = "") => {
  const res = await api.put(`/api/wallet/admin/refund-requests/${id}/reject`, { reason });
  return res.data.data;
};

export const transactionLabel = (txn: WalletTransaction): string => {
  const labels: Record<string, string> = {
    credit: "Credit",
    debit: "Debit",
    refund: "Refund",
    cashback: "Cashback",
    wallet_payment: "Wallet Payment",
  };
  return labels[txn.type] || txn.category || txn.type;
};
