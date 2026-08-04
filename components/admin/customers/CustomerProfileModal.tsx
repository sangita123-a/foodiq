"use client";

import { useState } from "react";
import Image from "next/image";
import {
  X,
  User,
  MapPin,
  ShoppingBag,
  Heart,
  Wallet,
  Gift,
  Headphones,
  Star,
  Bell,
  ShieldCheck,
  Ban,
  Unlock,
  KeyRound,
  Trash2,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  ArrowDownLeft,
  Crown,
  FileText,
  MessageSquare,
  PlusCircle,
  Award,
} from "lucide-react";
import type { Customer, CustomerOrder } from "@/services/customerAdminApi";
import {
  useCustomerAddresses,
  useCustomerOrders,
  useCustomerWallet,
  useCustomerLoyalty,
  useCustomerSupport,
  useCustomerReviews,
  useCustomerFavorites,
  useCustomerNotifications,
} from "@/hooks/useAdminCustomers";
import CustomerMap from "./CustomerMap";
import CustomerInvoiceModal from "./CustomerInvoiceModal";
import { adjustCustomerWallet } from "@/services/customerAdminApi";

type Props = {
  isOpen: boolean;
  customer: Customer | null;
  onClose: () => void;
  onToggleVerify: (customer: Customer) => void;
  onToggleBlock: (customer: Customer) => void;
  onResetPassword: (customer: Customer) => void;
  onDeleteCustomer: (customer: Customer) => void;
  onRefreshData?: () => void;
};

type TabType =
  | "personal"
  | "addresses"
  | "orders"
  | "favorites"
  | "wallet"
  | "loyalty"
  | "support"
  | "reviews"
  | "notifications";

export default function CustomerProfileModal({
  isOpen,
  customer,
  onClose,
  onToggleVerify,
  onToggleBlock,
  onResetPassword,
  onDeleteCustomer,
  onRefreshData,
}: Props) {
  const [activeTab, setActiveTab] = useState<TabType>("personal");
  const [orderStatusFilter, setOrderStatusFilter] = useState("all");
  const [selectedInvoiceOrder, setSelectedInvoiceOrder] = useState<CustomerOrder | null>(null);

  // Wallet adjustment modal state
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [walletAmount, setWalletAmount] = useState("");
  const [walletType, setWalletType] = useState<"credit" | "debit">("credit");
  const [walletReason, setWalletReason] = useState("");
  const [isAdjustingWallet, setIsAdjustingWallet] = useState(false);

  const customerId = customer?.id || null;

  // Sub-hooks for drawer tabs
  const { data: addresses = [] } = useCustomerAddresses(customerId);
  const { data: orders = [] } = useCustomerOrders(customerId, orderStatusFilter);
  const { data: walletData, mutate: mutateWallet } = useCustomerWallet(customerId);
  const { data: loyalty } = useCustomerLoyalty(customerId);
  const { data: supportTickets = [] } = useCustomerSupport(customerId);
  const { data: reviews = [] } = useCustomerReviews(customerId);
  const { data: favorites } = useCustomerFavorites(customerId);
  const { data: notificationPrefs } = useCustomerNotifications(customerId);

  if (!isOpen || !customer) return null;

  const tabs: Array<{ id: TabType; label: string; icon: React.ComponentType<{ className?: string }> }> = [
    { id: "personal", label: "Personal", icon: User },
    { id: "addresses", label: "Addresses", icon: MapPin },
    { id: "orders", label: "Orders", icon: ShoppingBag },
    { id: "favorites", label: "Favorites", icon: Heart },
    { id: "wallet", label: "Wallet", icon: Wallet },
    { id: "loyalty", label: "Loyalty & Rewards", icon: Gift },
    { id: "support", label: "Support", icon: Headphones },
    { id: "reviews", label: "Reviews", icon: Star },
    { id: "notifications", label: "Preferences", icon: Bell },
  ];

  const handleWalletSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(walletAmount);
    if (isNaN(amt) || amt <= 0) return;

    try {
      setIsAdjustingWallet(true);
      await adjustCustomerWallet(customer.id, {
        amount: amt,
        type: walletType,
        reason: walletReason || "Admin Balance Adjustment",
      });
      mutateWallet();
      onRefreshData?.();
      setShowWalletModal(false);
      setWalletAmount("");
      setWalletReason("");
    } catch {
      /* ignore */
    } finally {
      setIsAdjustingWallet(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-end animate-in fade-in">
      <div className="bg-white w-full max-w-4xl h-full shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right duration-300">
        {/* Drawer Header */}
        <div className="bg-slate-900 text-white p-6 flex items-center justify-between shrink-0 border-b border-slate-800">
          <div className="flex items-center gap-4 min-w-0">
            <div className="relative w-14 h-14 rounded-2xl overflow-hidden bg-slate-800 border-2 border-slate-700 shrink-0">
              {customer.avatarUrl ? (
                <Image src={customer.avatarUrl} alt={customer.fullName} fill className="object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center font-black text-[#E23744] text-xl bg-slate-800">
                  {customer.fullName.slice(0, 2).toUpperCase()}
                </div>
              )}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black truncate">{customer.fullName}</h2>
                {customer.isPremium && (
                  <span className="bg-amber-500/20 text-amber-300 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full border border-amber-500/30 flex items-center gap-1">
                    <Crown className="w-3 h-3" />
                    {customer.tier}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                {customer.customerId} • {customer.email} • {customer.phone}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-all"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Action Button Bar */}
        <div className="bg-slate-950 px-6 py-2.5 flex items-center justify-between border-b border-slate-800 text-xs shrink-0 overflow-x-auto">
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-semibold">Account Actions:</span>
            <button
              onClick={() => onToggleVerify(customer)}
              className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg font-bold flex items-center gap-1.5 transition-all"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
              <span>{customer.isVerified ? "Mark Unverified" : "Verify Customer"}</span>
            </button>
            <button
              onClick={() => onToggleBlock(customer)}
              className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg font-bold flex items-center gap-1.5 transition-all"
            >
              {customer.status === "blocked" ? (
                <>
                  <Unlock className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Unblock Account</span>
                </>
              ) : (
                <>
                  <Ban className="w-3.5 h-3.5 text-rose-400" />
                  <span>Block Account</span>
                </>
              )}
            </button>
            <button
              onClick={() => onResetPassword(customer)}
              className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg font-bold flex items-center gap-1.5 transition-all"
            >
              <KeyRound className="w-3.5 h-3.5 text-indigo-400" />
              <span>Reset Password</span>
            </button>
          </div>

          <button
            onClick={() => onDeleteCustomer(customer)}
            className="px-3 py-1 bg-rose-950/60 hover:bg-rose-900 text-rose-300 rounded-lg font-bold flex items-center gap-1.5 transition-all border border-rose-800/40"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete Customer</span>
          </button>
        </div>

        {/* Tab Navigation Navigation bar */}
        <div className="bg-gray-50 border-b border-gray-200 px-6 flex gap-1 overflow-x-auto shrink-0 custom-scrollbar">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-3 px-4 text-xs font-bold whitespace-nowrap flex items-center gap-2 border-b-2 transition-all ${
                  isActive
                    ? "border-[#E23744] text-[#E23744] bg-white shadow-sm"
                    : "border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-100/50"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Contents Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-gray-50/50">
          {/* TAB 1: PERSONAL DETAILS */}
          {activeTab === "personal" && (
            <div className="space-y-6 animate-in fade-in">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm space-y-3">
                  <h3 className="font-bold text-gray-900 text-sm border-b border-gray-100 pb-2">
                    Profile Summary
                  </h3>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Customer ID</span>
                      <span className="font-mono font-bold text-gray-900">{customer.customerId}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Full Name</span>
                      <span className="font-bold text-gray-900">{customer.fullName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Email Address</span>
                      <span className="font-medium text-gray-900">{customer.email}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Mobile Phone</span>
                      <span className="font-mono font-medium text-gray-900">{customer.phone}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Gender</span>
                      <span className="font-medium text-gray-900">{customer.gender || "Not specified"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Date of Birth</span>
                      <span className="font-medium text-gray-900">{customer.dob || "Not provided"}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm space-y-3">
                  <h3 className="font-bold text-gray-900 text-sm border-b border-gray-100 pb-2">
                    Account Status & Verification
                  </h3>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500">Status</span>
                      <span className="font-bold uppercase px-2.5 py-0.5 rounded-full text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {customer.status}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500">Identity Verification</span>
                      <span className="font-bold px-2.5 py-0.5 rounded-full text-[10px] bg-blue-50 text-blue-700 border border-blue-200">
                        {customer.isVerified ? "VERIFIED" : "UNVERIFIED"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Registered On</span>
                      <span className="font-medium text-gray-900">
                        {new Date(customer.registrationDate).toLocaleDateString("en-IN")}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Last Active</span>
                      <span className="font-medium text-gray-900">
                        {customer.lastActiveAt
                          ? new Date(customer.lastActiveAt).toLocaleString("en-IN")
                          : "Recently"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Loyalty Tier</span>
                      <span className="font-extrabold text-amber-600">{customer.tier}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Order & Spending Overview */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-white border border-gray-100 rounded-2xl p-4 text-center shadow-sm">
                  <div className="text-xs text-gray-500 font-medium">Total Orders</div>
                  <div className="text-xl font-black text-gray-900 mt-1">{customer.totalOrders}</div>
                </div>
                <div className="bg-white border border-gray-100 rounded-2xl p-4 text-center shadow-sm">
                  <div className="text-xs text-gray-500 font-medium">Total Spending</div>
                  <div className="text-xl font-black text-gray-900 mt-1">
                    ₹{customer.totalSpending.toLocaleString("en-IN")}
                  </div>
                </div>
                <div className="bg-white border border-gray-100 rounded-2xl p-4 text-center shadow-sm">
                  <div className="text-xs text-gray-500 font-medium">Wallet Balance</div>
                  <div className="text-xl font-black text-emerald-600 mt-1">
                    ₹{customer.walletBalance.toLocaleString("en-IN")}
                  </div>
                </div>
                <div className="bg-white border border-gray-100 rounded-2xl p-4 text-center shadow-sm">
                  <div className="text-xs text-gray-500 font-medium">Reward Points</div>
                  <div className="text-xl font-black text-purple-600 mt-1">{customer.rewardPoints} pts</div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: ADDRESSES & GOOGLE MAP */}
          {activeTab === "addresses" && (
            <div className="space-y-6 animate-in fade-in">
              <CustomerMap addresses={addresses} />

              <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm space-y-4">
                <h3 className="font-bold text-gray-900 text-sm">Saved Addresses ({addresses.length})</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {addresses.map((addr) => (
                    <div
                      key={addr.id}
                      className="border border-gray-200 rounded-2xl p-4 bg-gray-50/50 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sm text-gray-900 flex items-center gap-1.5">
                          <MapPin className="w-4 h-4 text-[#E23744]" />
                          {addr.label}
                        </span>
                        {addr.isDefault && (
                          <span className="bg-red-50 text-[#E23744] border border-red-100 text-[10px] font-bold px-2 py-0.5 rounded-full">
                            DEFAULT
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-600">{addr.addressLine1}</p>
                      {addr.landmark && (
                        <p className="text-xs text-gray-500 font-medium">Landmark: {addr.landmark}</p>
                      )}
                      <p className="text-xs text-gray-500">
                        {addr.city}, {addr.state} - {addr.pincode}
                      </p>
                      {addr.deliveryInstructions && (
                        <div className="text-[11px] bg-white p-2 rounded-xl border border-gray-100 text-gray-600 italic">
                          "{addr.deliveryInstructions}"
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: ORDER HISTORY */}
          {activeTab === "orders" && (
            <div className="space-y-6 animate-in fade-in">
              {/* Order Status Filters */}
              <div className="flex gap-2 overflow-x-auto pb-1">
                {["all", "completed", "cancelled", "refunded", "pending", "scheduled"].map((st) => (
                  <button
                    key={st}
                    onClick={() => setOrderStatusFilter(st)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize whitespace-nowrap transition-all ${
                      orderStatusFilter === st
                        ? "bg-[#E23744] text-white shadow-sm"
                        : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    {st} Orders
                  </button>
                ))}
              </div>

              {/* Order Cards */}
              <div className="space-y-4">
                {orders.map((ord) => (
                  <div
                    key={ord.id}
                    className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm space-y-4 hover:border-gray-300 transition-all"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-black text-sm text-gray-900">{ord.restaurantName}</span>
                          <span className="font-mono text-xs text-gray-400">#{ord.orderNumber}</span>
                        </div>
                        <div className="text-xs text-gray-500 font-medium">
                          {new Date(ord.date).toLocaleString("en-IN")}
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-bold ${
                            ord.status === "Completed"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : ord.status === "Cancelled"
                              ? "bg-rose-50 text-rose-700 border border-rose-200"
                              : ord.status === "Refunded"
                              ? "bg-purple-50 text-purple-700 border border-purple-200"
                              : "bg-blue-50 text-blue-700 border border-blue-200"
                          }`}
                        >
                          {ord.status}
                        </span>
                        <span className="font-black text-gray-900 text-base">
                          ₹{ord.totalAmount.toLocaleString("en-IN")}
                        </span>
                      </div>
                    </div>

                    <div className="text-xs text-gray-700 bg-gray-50 p-3 rounded-xl">
                      <span className="font-bold text-gray-900">Items:</span> {ord.itemsSummary}
                    </div>

                    {/* Timeline */}
                    <div className="space-y-2">
                      <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                        Order Timeline
                      </div>
                      <div className="flex items-center gap-3 overflow-x-auto pb-1 text-xs">
                        {ord.timeline.map((item, idx) => (
                          <div
                            key={idx}
                            className="bg-white border border-gray-200 rounded-xl px-3 py-1.5 shrink-0 flex items-center gap-2"
                          >
                            <Clock className="w-3.5 h-3.5 text-[#E23744]" />
                            <div>
                              <div className="font-bold text-gray-800">{item.status}</div>
                              <div className="text-[10px] text-gray-500">{item.timestamp}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {ord.hasInvoice && (
                      <div className="flex justify-end pt-1">
                        <button
                          onClick={() => setSelectedInvoiceOrder(ord)}
                          className="px-3.5 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all"
                        >
                          <FileText className="w-3.5 h-3.5 text-[#E23744]" />
                          <span>View Tax Invoice</span>
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: FAVORITES & WISHLIST */}
          {activeTab === "favorites" && favorites && (
            <div className="space-y-6 animate-in fade-in">
              {/* Favorite Restaurants */}
              <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm space-y-4">
                <h3 className="font-bold text-gray-900 text-sm">Favorite Restaurants</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {favorites.favoriteRestaurants.map((r) => (
                    <div
                      key={r.id}
                      className="border border-gray-100 rounded-xl p-3 flex items-center gap-3 bg-gray-50/50"
                    >
                      <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-gray-200 shrink-0">
                        <Image src={r.imageUrl} alt={r.name} fill className="object-cover" />
                      </div>
                      <div>
                        <div className="font-bold text-xs text-gray-900">{r.name}</div>
                        <div className="text-[11px] text-gray-500">{r.cuisine}</div>
                        <div className="text-[10px] font-bold text-amber-600 flex items-center gap-1 mt-0.5">
                          <Star className="w-3 h-3 fill-amber-500" />
                          <span>{r.rating}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Favorite Foods */}
              <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm space-y-4">
                <h3 className="font-bold text-gray-900 text-sm">Favorite Foods</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {favorites.favoriteFoods.map((f) => (
                    <div
                      key={f.id}
                      className="border border-gray-100 rounded-xl p-3 flex items-center gap-3 bg-gray-50/50"
                    >
                      <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-gray-200 shrink-0">
                        <Image src={f.imageUrl} alt={f.name} fill className="object-cover" />
                      </div>
                      <div>
                        <div className="font-bold text-xs text-gray-900">{f.name}</div>
                        <div className="text-[11px] text-gray-500">{f.restaurantName}</div>
                        <div className="text-xs font-black text-gray-900 mt-0.5">₹{f.price}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: WALLET & TRANSACTIONS */}
          {activeTab === "wallet" && walletData && (
            <div className="space-y-6 animate-in fade-in">
              <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-3xl p-6 shadow-xl flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Foodiq Wallet Balance
                  </div>
                  <div className="text-3xl font-black text-white mt-1">
                    ₹{walletData.balance.toLocaleString("en-IN")}
                  </div>
                </div>

                <button
                  onClick={() => setShowWalletModal(true)}
                  className="px-4 py-2.5 bg-[#E23744] hover:bg-red-700 text-white rounded-2xl font-bold text-xs flex items-center gap-2 shadow-lg transition-all"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Adjust Balance</span>
                </button>
              </div>

              {/* Transactions Ledger */}
              <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm space-y-4">
                <h3 className="font-bold text-gray-900 text-sm">Wallet Transactions Ledger</h3>
                <div className="space-y-2">
                  {walletData.transactions.map((tx) => (
                    <div
                      key={tx.id}
                      className="border border-gray-100 rounded-xl p-3 flex items-center justify-between bg-gray-50/50 text-xs"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                            tx.type === "credit"
                              ? "bg-emerald-50 text-emerald-600"
                              : tx.type === "refund"
                              ? "bg-purple-50 text-purple-600"
                              : "bg-rose-50 text-rose-600"
                          }`}
                        >
                          {tx.type === "credit" ? (
                            <ArrowDownLeft className="w-4 h-4" />
                          ) : (
                            <ArrowUpRight className="w-4 h-4" />
                          )}
                        </div>
                        <div>
                          <div className="font-bold text-gray-900">{tx.description}</div>
                          <div className="text-[10px] text-gray-500 font-mono">
                            {new Date(tx.createdAt).toLocaleString("en-IN")}
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <div
                          className={`font-black ${
                            tx.type === "credit" || tx.type === "refund"
                              ? "text-emerald-600"
                              : "text-rose-600"
                          }`}
                        >
                          {tx.type === "debit" ? "-" : "+"}₹{tx.amount.toLocaleString("en-IN")}
                        </div>
                        <div className="text-[10px] text-gray-400 font-mono">
                          Bal: ₹{tx.balanceAfter.toLocaleString("en-IN")}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: LOYALTY & REWARDS */}
          {activeTab === "loyalty" && loyalty && (
            <div className="space-y-6 animate-in fade-in">
              <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-gray-500 uppercase">Loyalty Tier</span>
                    <h3 className="text-xl font-black text-amber-600">{loyalty.tier} Member</h3>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-gray-500 uppercase">Points Balance</span>
                    <h3 className="text-xl font-black text-purple-700">{loyalty.rewardPoints} Pts</h3>
                  </div>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800 font-semibold flex items-center justify-between">
                  <span>Earn {loyalty.nextTierPointsNeeded} more points to reach Platinum tier</span>
                  <Award className="w-4 h-4 text-amber-600" />
                </div>
              </div>

              {/* Coupons Used */}
              <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm space-y-3">
                <h3 className="font-bold text-gray-900 text-sm">Coupons Redeemed</h3>
                <div className="space-y-2 text-xs">
                  {loyalty.couponsUsed.map((cp, idx) => (
                    <div
                      key={idx}
                      className="border border-gray-100 rounded-xl p-3 flex items-center justify-between bg-gray-50/50"
                    >
                      <span className="font-mono font-bold text-gray-900">{cp.code}</span>
                      <span className="font-bold text-emerald-600">-₹{cp.discountAmount}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 7: SUPPORT TICKETS */}
          {activeTab === "support" && (
            <div className="space-y-4 animate-in fade-in">
              {supportTickets.map((tkt) => (
                <div
                  key={tkt.id}
                  className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-bold text-gray-900 text-sm">{tkt.subject}</span>
                      <span className="font-mono text-xs text-gray-400 block">#{tkt.ticketId}</span>
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {tkt.status}
                    </span>
                  </div>

                  {tkt.chatLog && (
                    <div className="bg-gray-50 p-3 rounded-xl space-y-2 text-xs">
                      {tkt.chatLog.map((c, i) => (
                        <div key={i} className="flex gap-2">
                          <span className="font-bold text-gray-900 capitalize">{c.sender}:</span>
                          <span className="text-gray-700">{c.message}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* TAB 8: REVIEWS & RATINGS */}
          {activeTab === "reviews" && (
            <div className="space-y-4 animate-in fade-in">
              {reviews.map((rev) => (
                <div
                  key={rev.id}
                  className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-gray-900">{rev.targetName}</span>
                    <div className="flex items-center text-amber-500 font-bold">
                      <Star className="w-3.5 h-3.5 fill-amber-500" />
                      <span className="ml-1">{rev.rating} / 5</span>
                    </div>
                  </div>
                  <p className="text-gray-600 italic">"{rev.comment}"</p>
                </div>
              ))}
            </div>
          )}

          {/* TAB 9: NOTIFICATION PREFERENCES */}
          {activeTab === "notifications" && notificationPrefs && (
            <div className="space-y-6 animate-in fade-in">
              <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm space-y-3">
                <h3 className="font-bold text-gray-900 text-sm">Channel Preferences</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                  {Object.entries({
                    SMS: notificationPrefs.sms,
                    Email: notificationPrefs.email,
                    Push: notificationPrefs.push,
                    WhatsApp: notificationPrefs.whatsapp,
                    Promotions: notificationPrefs.promotions,
                    "Order Updates": notificationPrefs.orderUpdates,
                  }).map(([key, val]) => (
                    <div
                      key={key}
                      className="border border-gray-100 rounded-xl p-3 bg-gray-50 flex items-center justify-between"
                    >
                      <span className="font-semibold text-gray-700">{key}</span>
                      <span
                        className={`font-bold px-2 py-0.5 rounded-full text-[10px] ${
                          val ? "bg-emerald-100 text-emerald-800" : "bg-gray-200 text-gray-600"
                        }`}
                      >
                        {val ? "ENABLED" : "DISABLED"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Invoice Viewer Modal */}
      <CustomerInvoiceModal
        isOpen={Boolean(selectedInvoiceOrder)}
        order={selectedInvoiceOrder}
        customer={customer}
        onClose={() => setSelectedInvoiceOrder(null)}
      />

      {/* Wallet Balance Adjust Modal */}
      {showWalletModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-4">
            <h3 className="font-black text-gray-900 text-base">Adjust Customer Wallet Balance</h3>

            <form onSubmit={handleWalletSubmit} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-gray-600 block mb-1">Adjustment Type</label>
                <select
                  value={walletType}
                  onChange={(e) => setWalletType(e.target.value as "credit" | "debit")}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 font-semibold"
                >
                  <option value="credit">Credit (Add Money)</option>
                  <option value="debit">Debit (Deduct Money)</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-gray-600 block mb-1">Amount (₹)</label>
                <input
                  type="number"
                  required
                  value={walletAmount}
                  onChange={(e) => setWalletAmount(e.target.value)}
                  placeholder="e.g. 500"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 font-bold"
                />
              </div>

              <div>
                <label className="font-bold text-gray-600 block mb-1">Reason / Reference</label>
                <input
                  type="text"
                  required
                  value={walletReason}
                  onChange={(e) => setWalletReason(e.target.value)}
                  placeholder="e.g. Compensation bonus for delay"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 font-medium"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowWalletModal(false)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isAdjustingWallet}
                  className="px-4 py-2 bg-[#E23744] text-white font-bold rounded-xl"
                >
                  {isAdjustingWallet ? "Saving..." : "Apply Adjustment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
