"use client";

import { useMemo, useState } from "react";
import { AnimatePresence } from "framer-motion";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PaymentsHeader from "@/components/payments/PaymentsHeader";
import CreditCardItem, { CardType } from "@/components/payments/CreditCardItem";
import UpiItem, { UpiType } from "@/components/payments/UpiItem";
import WalletItem, { WalletType } from "@/components/payments/WalletItem";
import PaymentFormModal from "@/components/payments/PaymentFormModal";
import SecurityBadges from "@/components/payments/SecurityBadges";
import PaymentsEmptyState from "@/components/payments/PaymentsEmptyState";
import useSWR from "swr";
import { format } from "date-fns";
import api from "@/services/api";
import { useToast } from "@/contexts/ToastContext";
import { useAuthToken } from "@/hooks/useAuthToken";

export default function PaymentMethodsPage() {
  const hasToken = useAuthToken();
  const { data, mutate, isLoading } = useSWR(hasToken ? "/api/payment-methods" : null);
  const methods = data || [];
  const { showToast } = useToast();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [initialModalType, setInitialModalType] = useState<"Card" | "UPI">("Card");

  const { data: historyData, isLoading: isLoadingHistory, error: historyError } = useSWR(
    hasToken ? "/api/payments/history" : null
  );
  const paymentHistory = historyData || [];

  const cards: CardType[] = useMemo(
    () =>
      methods
        .filter((m: any) => m.type === "credit_card" || m.type === "debit_card")
        .map((m: any) => ({
          id: m.id,
          name: m.card_holder_name || "Card Holder",
          maskedNumber: `**** **** **** ${m.card_last4 || "****"}`,
          expiry: m.card_expiry || "--/--",
          network: (m.card_brand as any) || "Visa",
          isDefault: !!m.is_default,
        })),
    [methods]
  );

  const upis: UpiType[] = useMemo(
    () =>
      methods
        .filter((m: any) => m.type === "upi")
        .map((m: any) => ({ id: m.id, upiId: m.upi_id })),
    [methods]
  );

  const wallets: WalletType[] = useMemo(() => {
    const saved = methods.filter((m: any) => m.type === "wallet");
    const names = ["PhonePe", "Google Pay", "Paytm", "Amazon Pay"];
    return names.map((name, i) => {
      const found = saved.find((w: any) => w.wallet_name === name);
      return { id: found?.id || `w-${i}`, name, isConnected: !!found };
    });
  }, [methods]);

  const handleAddNew = () => {
    setEditingItem(null);
    setInitialModalType("Card");
    setIsModalOpen(true);
  };

  const handleEditCard = (card: CardType) => {
    setEditingItem(card);
    setInitialModalType("Card");
    setIsModalOpen(true);
  };

  const handleRemoveCard = async (id: string) => {
    try {
      await api.delete(`/api/payment-methods/${id}`);
      mutate();
      showToast("Card removed", "success");
    } catch (err: any) {
      showToast(err.response?.data?.message || "Failed", "error");
    }
  };

  const handleSetDefaultCard = async (id: string) => {
    try {
      await api.put(`/api/payment-methods/${id}/default`);
      mutate();
      showToast("Default card updated", "success");
    } catch (err: any) {
      showToast(err.response?.data?.message || "Failed", "error");
    }
  };

  const handleSaveCard = async (card: CardType) => {
    try {
      const digits = card.maskedNumber.replace(/\D/g, "");
      if (editingItem?.id && !editingItem.id.startsWith("c")) {
        await api.put(`/api/payment-methods/${editingItem.id}`, {
          card_holder_name: card.name,
          card_brand: card.network,
          card_expiry: card.expiry,
          is_default: card.isDefault,
          card_number: digits.length >= 4 ? digits : undefined,
        });
      } else {
        await api.post("/api/payment-methods", {
          type: "credit_card",
          card_holder_name: card.name,
          card_number: digits.length >= 12 ? digits : `411111111111${digits.slice(-4) || "1111"}`,
          card_brand: card.network,
          card_expiry: card.expiry,
          is_default: card.isDefault,
        });
      }
      mutate();
      setIsModalOpen(false);
      showToast("Card saved", "success");
    } catch (err: any) {
      showToast(err.response?.data?.message || "Failed to save card", "error");
    }
  };

  const handleEditUpi = (upi: UpiType) => {
    setEditingItem(upi);
    setInitialModalType("UPI");
    setIsModalOpen(true);
  };

  const handleRemoveUpi = async (id: string) => {
    try {
      await api.delete(`/api/payment-methods/${id}`);
      mutate();
      showToast("UPI removed", "success");
    } catch (err: any) {
      showToast(err.response?.data?.message || "Failed", "error");
    }
  };

  const handleSaveUpi = async (upi: UpiType) => {
    try {
      if (editingItem?.id && !String(editingItem.id).startsWith("u")) {
        await api.put(`/api/payment-methods/${editingItem.id}`, { upi_id: upi.upiId });
      } else {
        await api.post("/api/payment-methods", { type: "upi", upi_id: upi.upiId });
      }
      mutate();
      setIsModalOpen(false);
      showToast("UPI saved", "success");
    } catch (err: any) {
      showToast(err.response?.data?.message || "Failed to save UPI", "error");
    }
  };

  const handleToggleWallet = async (id: string) => {
    const wallet = wallets.find((w) => w.id === id);
    if (!wallet) return;
    try {
      if (wallet.isConnected && !id.startsWith("w-")) {
        await api.delete(`/api/payment-methods/${id}`);
      } else {
        await api.post("/api/payment-methods", { type: "wallet", wallet_name: wallet.name });
      }
      mutate();
    } catch (err: any) {
      showToast(err.response?.data?.message || "Failed to update wallet", "error");
    }
  };

  const hasAnyPaymentMethod = cards.length > 0 || upis.length > 0 || wallets.some((w) => w.isConnected);

  if (isLoading) {
    return (
      <main className="min-h-screen bg-background pt-[90px]">
        <Navbar />
        <div className="container mx-auto px-4 py-12 max-w-5xl">
          <div className="h-64 bg-section animate-pulse rounded-3xl" />
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background relative selection:bg-[var(--color-primary)] selection:text-white pt-[90px]">
      <Navbar />

      <div className="container mx-auto px-4 md:px-8 py-12 max-w-5xl">
        <PaymentsHeader onAddNew={handleAddNew} />

        {hasAnyPaymentMethod ? (
          <div className="flex flex-col gap-12">
            {cards.length > 0 && (
              <section>
                <h3 className="text-2xl font-bold text-foreground mb-6">Credit & Debit Cards</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
                  <AnimatePresence>
                    {cards.map((card) => (
                      <CreditCardItem
                        key={card.id}
                        card={card}
                        onEdit={handleEditCard}
                        onRemove={handleRemoveCard}
                        onSetDefault={handleSetDefaultCard}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              </section>
            )}

            {upis.length > 0 && (
              <section>
                <h3 className="text-2xl font-bold text-foreground mb-6">UPI Accounts</h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <AnimatePresence>
                    {upis.map((upi) => (
                      <UpiItem key={upi.id} upi={upi} onEdit={handleEditUpi} onRemove={handleRemoveUpi} />
                    ))}
                  </AnimatePresence>
                </div>
              </section>
            )}

            <section>
              <h3 className="text-2xl font-bold text-foreground mb-6">Wallets</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {wallets.map((wallet) => (
                  <WalletItem key={wallet.id} wallet={wallet} onToggleConnect={handleToggleWallet} />
                ))}
              </div>
            </section>
          </div>
        ) : (
          <PaymentsEmptyState onAddNew={handleAddNew} />
        )}

        <div className="mt-16 mb-12">
          <h3 className="text-2xl font-bold text-foreground mb-6">Payment History</h3>
          {isLoadingHistory ? (
            <div className="h-64 bg-section animate-pulse rounded-2xl border border-border"></div>
          ) : historyError ? (
            <div className="p-6 bg-red-500/10 border border-red-500/20 text-red-500 rounded-2xl text-center">
              Failed to load payment history
            </div>
          ) : paymentHistory.length > 0 ? (
            <div className="bg-white rounded-3xl border border-border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-gray-text">
                  <thead className="bg-section text-gray-text uppercase font-bold text-xs tracking-wide">
                    <tr>
                      <th className="px-6 py-4">Transaction ID</th>
                      <th className="px-6 py-4">Restaurant</th>
                      <th className="px-6 py-4">Date</th>
                      <th className="px-6 py-4">Method</th>
                      <th className="px-6 py-4">Amount</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paymentHistory.map((payment: any) => (
                      <tr key={payment.id} className="border-b border-border hover:bg-section transition-colors">
                        <td className="px-6 py-4 font-mono text-xs text-foreground">
                          {payment.razorpay_payment_id ||
                            payment.provider_transaction_id ||
                            "Pending..."}
                        </td>
                        <td className="px-6 py-4 text-foreground">
                          {payment.restaurant_name || "—"}
                        </td>
                        <td className="px-6 py-4">
                          {format(
                            new Date(payment.transaction_time || payment.created_at),
                            "dd MMM yyyy, p"
                          )}
                        </td>
                        <td className="px-6 py-4 capitalize">
                          {(payment.method || "").replace(/_/g, " ")}
                        </td>
                        <td className="px-6 py-4 text-foreground font-bold">
                          ₹{parseFloat(payment.amount).toFixed(2)}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-bold border ${
                              payment.status === "completed"
                                ? "bg-green-50 text-green-700 border-green-200"
                                : payment.status === "pending"
                                  ? "bg-yellow-50 text-yellow-700 border-yellow-200"
                                  : payment.status === "refunded" ||
                                      payment.status === "partially_refunded"
                                    ? "bg-blue-50 text-blue-700 border-blue-200"
                                    : "bg-red-50 text-red-700 border-red-200"
                            }`}
                          >
                            {String(payment.status || "")
                              .replace(/_/g, " ")
                              .replace(/^\w/, (c: string) => c.toUpperCase())}
                          </span>
                        </td>
                        <td className="px-6 py-4 space-x-2 whitespace-nowrap">
                          {(payment.status === "completed" ||
                            payment.status === "refunded" ||
                            payment.status === "partially_refunded") && (
                            <button
                              type="button"
                              className="text-xs font-bold text-primary hover:underline"
                              onClick={async () => {
                                try {
                                  const { downloadInvoiceFile } = await import("@/services/paymentApi");
                                  await downloadInvoiceFile(payment.id, payment.order_id);
                                } catch {
                                  showToast("Could not download invoice", "error");
                                }
                              }}
                            >
                              Invoice
                            </button>
                          )}
                          {(payment.status === "failed" || payment.status === "pending") &&
                            payment.method !== "cod" &&
                            payment.order_id && (
                              <a
                                href={`/payment?orderId=${payment.order_id}&amount=${payment.amount}&method=${payment.method}`}
                                className="text-xs font-bold text-foreground hover:underline"
                              >
                                Retry
                              </a>
                            )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="text-center text-[#9CA3AF] py-10 bg-section rounded-3xl border border-border">
              No recent transactions found.
            </div>
          )}
        </div>

        <SecurityBadges />
      </div>

      <Footer />

      <AnimatePresence>
        {isModalOpen && (
          <PaymentFormModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            onSaveCard={handleSaveCard}
            onSaveUpi={handleSaveUpi}
            initialData={editingItem}
            initialType={initialModalType}
          />
        )}
      </AnimatePresence>
    </main>
  );
}
