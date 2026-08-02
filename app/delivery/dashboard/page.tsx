"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { mutate } from "swr";
import {
  Wallet,
  Package,
  Clock,
  Star,
  Power,
  Bike,
  MapPin,
  ArrowRight,
  TrendingUp,
  ShieldCheck,
  CheckSquare,
  History,
  User,
  FileText,
  HelpCircle,
  PhoneCall,
  Loader2,
  AlertCircle,
  ChevronRight,
  Navigation,
} from "lucide-react";
import DeliveryShell from "@/components/delivery/DeliveryShell";
import OrderExpiryCountdown from "@/components/delivery/OrderExpiryCountdown";
import { useDeliveryDashboard, useDeliveryMe } from "@/hooks/useDeliveryData";
import {
  acceptDeliveryOrder,
  rejectDeliveryOrder,
  setDeliveryAvailability,
  formatCurrency,
  STATUS_LABELS,
} from "@/services/deliveryApi";
import { isClientAuthenticated } from "@/lib/authSession";
import { useToast } from "@/contexts/ToastContext";

export default function DeliveryDashboardPage() {
  const router = useRouter();
  const { showToast } = useToast();

  const { data: me } = useDeliveryMe();
  const { data, error, isLoading } = useDeliveryDashboard();

  const [toggling, setToggling] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Authentication Protection Guard
  useEffect(() => {
    if (typeof window !== "undefined" && !isClientAuthenticated()) {
      router.replace("/delivery/login");
    }
  }, [router]);

  const partnerInfo = (data?.partner || me?.partner || {}) as {
    full_name?: string;
    vehicle_type?: string;
    vehicle_number?: string;
    approval_status?: string;
    status?: string;
    city?: string;
    rating?: number;
    profile_photo?: string;
  };

  const isOnline = data?.is_online ?? Boolean(partnerInfo?.vehicle_type ? (data?.partner as any)?.is_available : false);
  const partnerName = me?.user?.full_name || partnerInfo?.full_name || "Rider Partner";
  const approvalStatus = partnerInfo?.approval_status || partnerInfo?.status || "approved";
  const isPendingApproval = approvalStatus === "pending";

  const refreshAll = () => {
    mutate("/api/delivery/dashboard");
    mutate("/api/delivery/me");
    mutate("/api/delivery/orders/available");
    mutate("/api/delivery/orders/assigned");
  };

  const handleToggleOnline = async () => {
    setToggling(true);
    try {
      const nextState = !isOnline;
      await setDeliveryAvailability(nextState);
      showToast(nextState ? "You are now Online and ready for orders!" : "You are now Offline.", "success");
      refreshAll();
    } catch (err: unknown) {
      showToast("Failed to update availability status.", "error");
    } finally {
      setToggling(false);
    }
  };

  const handleAcceptOrder = async (orderId: string) => {
    setActionLoadingId(orderId);
    try {
      await acceptDeliveryOrder(orderId);
      showToast("Order accepted successfully!", "success");
      refreshAll();
    } catch (err: unknown) {
      showToast("Failed to accept order. It may no longer be available.", "error");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleRejectOrder = async (orderId: string) => {
    setActionLoadingId(orderId);
    try {
      await rejectDeliveryOrder(orderId);
      showToast("Order declined.", "success");
      refreshAll();
    } catch (err: unknown) {
      showToast("Failed to decline order.", "error");
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <DeliveryShell online={isOnline}>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Pending Approval Banner if needed */}
        {isPendingApproval && (
          <div className="flex items-start gap-3 p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 shadow-sm">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="flex-1 text-sm">
              <p className="font-extrabold mb-0.5">Account Verification Pending</p>
              <p className="text-amber-800">
                Your delivery partner profile is currently awaiting admin verification. You can view your dashboard, but order requests will begin after approval. Make sure your{" "}
                <Link href="/delivery/documents" className="font-bold underline hover:text-amber-950">
                  documents & profile details
                </Link>{" "}
                are up to date.
              </p>
            </div>
          </div>
        )}

        {/* 1. Welcome Card + 2. Online/Offline Toggle */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Welcome Card (Spans 2 cols on lg) */}
          <div className="lg:col-span-2 bg-white border border-border rounded-2xl p-6 sm:p-8 shadow-card flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-primary/5 rounded-full blur-2xl pointer-events-none" />

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-primary-soft text-primary flex items-center justify-center font-black text-2xl border border-primary/20 shrink-0">
                  {partnerName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h2 className="text-xl sm:text-2xl font-extrabold text-foreground tracking-tight">
                      Welcome back, {partnerName.split(" ")[0]}! 👋
                    </h2>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-text flex-wrap">
                    <span className="inline-flex items-center gap-1 font-semibold text-foreground">
                      <Bike className="w-3.5 h-3.5 text-primary" />
                      {partnerInfo.vehicle_type || "Bike"} &bull; {partnerInfo.vehicle_number || "Partner"}
                    </span>
                    <span>&bull;</span>
                    <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      Verified Partner
                    </span>
                  </div>
                </div>
              </div>

              <div className="sm:text-right shrink-0">
                <p className="text-xs font-semibold text-muted uppercase tracking-wider">Overall Rating</p>
                <div className="flex items-center sm:justify-end gap-1 text-star font-extrabold text-lg mt-0.5">
                  <Star className="w-5 h-5 fill-star text-star" />
                  <span>{Number(data?.rating || partnerInfo.rating || 5.0).toFixed(1)}</span>
                  <span className="text-xs text-gray-text font-normal">/ 5.0</span>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-border flex items-center justify-between text-xs text-gray-text relative z-10">
              <span>Ready for active deliveries in {partnerInfo.city || "your city"}</span>
              <span className="font-semibold text-foreground">
                {data?.completed_today || 0} deliveries completed today
              </span>
            </div>
          </div>

          {/* Online / Offline Toggle Card */}
          <div className="bg-white border border-border rounded-2xl p-6 sm:p-8 shadow-card flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold uppercase tracking-wider text-muted">
                  Duty Status
                </span>
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold ${
                    isOnline
                      ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                      : "bg-gray-100 text-gray-700 border border-gray-300"
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      isOnline ? "bg-emerald-600 animate-pulse" : "bg-gray-500"
                    }`}
                  />
                  {isOnline ? "ONLINE" : "OFFLINE"}
                </span>
              </div>

              <h3 className="text-lg font-bold text-foreground mb-1">
                {isOnline ? "You are receiving orders" : "You are currently offline"}
              </h3>
              <p className="text-xs text-gray-text mb-6">
                {isOnline
                  ? "Stay available to receive nearby pickup and delivery requests."
                  : "Toggle your status online to start receiving delivery offers."}
              </p>
            </div>

            <button
              type="button"
              onClick={handleToggleOnline}
              disabled={toggling}
              className={`w-full py-3.5 px-4 rounded-xl font-extrabold text-sm flex items-center justify-center gap-2.5 transition-all shadow-button disabled:opacity-60 cursor-pointer ${
                isOnline
                  ? "bg-red-50 hover:bg-red-100 text-red-600 border border-red-200"
                  : "bg-primary hover:bg-primary-hover text-white"
              }`}
            >
              {toggling ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Updating status...</span>
                </>
              ) : (
                <>
                  <Power className="w-5 h-5" />
                  <span>{isOnline ? "Go Offline" : "Go Online Now"}</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* 3. Today's Earnings, 4. Today's Deliveries, 5. Pending Pickups, 7. Rating Overview Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Today's Earnings */}
          <div className="bg-white border border-border rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-muted">
                Today's Earnings
              </span>
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
                <Wallet className="w-5 h-5" />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
              {formatCurrency(data?.earnings_today || 0)}
            </p>
            <p className="text-xs text-gray-text mt-1.5 flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
              <span>Weekly: {formatCurrency(data?.earnings_weekly || 0)}</span>
            </p>
          </div>

          {/* Today's Deliveries */}
          <div className="bg-white border border-border rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-muted">
                Today's Deliveries
              </span>
              <div className="w-9 h-9 rounded-xl bg-primary-soft text-primary flex items-center justify-center border border-primary/10">
                <Package className="w-5 h-5" />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
              {data?.completed_today || 0}
            </p>
            <p className="text-xs text-gray-text mt-1.5">
              Total lifetime: <span className="font-bold text-foreground">{data?.completed_total || 0}</span>
            </p>
          </div>

          {/* Pending Pickups */}
          <div className="bg-white border border-border rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-muted">
                Pending Pickups
              </span>
              <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100">
                <Clock className="w-5 h-5" />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
              {data?.pending_deliveries || 0}
            </p>
            <p className="text-xs text-gray-text mt-1.5">
              Active assigned tasks
            </p>
          </div>

          {/* Rating */}
          <div className="bg-white border border-border rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-muted">
                Customer Rating
              </span>
              <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100">
                <Star className="w-5 h-5 fill-amber-500 text-amber-500" />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
              {Number(data?.rating || partnerInfo.rating || 5.0).toFixed(1)}
            </p>
            <p className="text-xs text-gray-text mt-1.5">
              Based on completed trips
            </p>
          </div>
        </div>

        {/* Delivery Partner Ratings & Reviews summary */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white border border-border rounded-2xl p-5 shadow-sm">
            <span className="text-xs font-bold uppercase tracking-wider text-muted">
              Average Rating
            </span>
            <p className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight mt-3">
              {(data?.review_stats?.average_rating || 0).toFixed(1)}
            </p>
            <p className="text-xs text-gray-text mt-1.5">From delivery reviews</p>
          </div>

          <div className="bg-white border border-border rounded-2xl p-5 shadow-sm">
            <span className="text-xs font-bold uppercase tracking-wider text-muted">
              Total Reviews
            </span>
            <p className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight mt-3">
              {data?.review_stats?.total_reviews || 0}
            </p>
            <Link href="/delivery/reviews" className="text-xs text-primary font-bold mt-1.5 inline-block hover:underline">
              View all reviews
            </Link>
          </div>

          <div className="bg-white border border-border rounded-2xl p-5 shadow-sm">
            <span className="text-xs font-bold uppercase tracking-wider text-muted">
              5★ Percentage
            </span>
            <p className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight mt-3">
              {data?.review_stats?.five_star_percentage || 0}%
            </p>
            <p className="text-xs text-gray-text mt-1.5">Of all reviews</p>
          </div>

          <div className="bg-white border border-border rounded-2xl p-5 shadow-sm">
            <span className="text-xs font-bold uppercase tracking-wider text-muted">
              Latest Review
            </span>
            {data?.review_stats?.latest_review ? (
              <>
                <div className="flex items-center gap-1 mt-3">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  <span className="font-extrabold text-foreground">
                    {data.review_stats.latest_review.rating}
                  </span>
                </div>
                <p className="text-xs text-gray-text mt-1.5 line-clamp-2">
                  {data.review_stats.latest_review.review || "No comment."}
                </p>
              </>
            ) : (
              <p className="text-xs text-gray-text mt-3">No reviews yet</p>
            )}
          </div>
        </div>

        {/* Main Grid Section: 6. Active Orders & Nearby Orders */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Active Orders Card */}
          <div className="bg-white border border-border rounded-2xl p-5 sm:p-6 shadow-card flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-border">
                <div className="flex items-center gap-2">
                  <Package className="w-5 h-5 text-primary" />
                  <h3 className="text-lg font-extrabold text-foreground">Active Orders</h3>
                </div>
                <Link
                  href="/delivery/orders?tab=accepted"
                  className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
                >
                  View All ({data?.assigned_orders?.length || 0})
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>

              {isLoading && !data ? (
                <div className="py-12 text-center text-muted flex items-center justify-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Loading active orders...</span>
                </div>
              ) : data?.assigned_orders && data.assigned_orders.length > 0 ? (
                <div className="space-y-4">
                  {data.assigned_orders.slice(0, 3).map((order) => (
                    <div
                      key={order.id}
                      className="border border-border rounded-xl p-4 bg-white hover:border-primary/40 transition-all space-y-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <span className="text-[10px] font-extrabold tracking-wider uppercase px-2 py-0.5 rounded bg-primary-soft text-primary border border-primary/20">
                            {STATUS_LABELS[order.assignment_status || ""] || order.assignment_status || "Assigned"}
                          </span>
                          <h4 className="font-extrabold text-foreground text-base mt-1.5">
                            {order.restaurant.name}
                          </h4>
                        </div>
                        <span className="font-extrabold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 text-sm">
                          {formatCurrency(order.delivery_fee)}
                        </span>
                      </div>

                      <div className="text-xs text-gray-text space-y-1.5 pt-2 border-t border-border/60">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-primary shrink-0" />
                          <span className="truncate font-medium text-foreground">
                            Customer: {order.customer.address || "Delivery Address"}
                          </span>
                        </div>
                        {order.customer.phone && (
                          <div className="flex items-center gap-2 text-muted">
                            <PhoneCall className="w-3.5 h-3.5 shrink-0" />
                            <span>{order.customer.phone}</span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-end gap-2 pt-2">
                        <Link
                          href={`/delivery/orders/${order.id}`}
                          className="w-full bg-primary hover:bg-primary-hover text-white text-xs font-extrabold py-2.5 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-colors text-center"
                        >
                          <span>Manage Delivery Order</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center text-gray-text">
                  <Package className="w-12 h-12 text-muted mx-auto mb-3 opacity-40" />
                  <p className="font-bold text-foreground text-sm mb-1">No Active Orders Right Now</p>
                  <p className="text-xs text-muted max-w-xs mx-auto">
                    {isOnline
                      ? "You're online! New order requests will appear here as soon as restaurants assign them."
                      : "Go online to receive nearby delivery requests."}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Available Nearby Orders Card */}
          <div className="bg-white border border-border rounded-2xl p-5 sm:p-6 shadow-card flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-border">
                <div className="flex items-center gap-2">
                  <Navigation className="w-5 h-5 text-primary" />
                  <h3 className="text-lg font-extrabold text-foreground">Available Orders Nearby</h3>
                </div>
                <Link
                  href="/delivery/orders?tab=available"
                  className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
                >
                  View All ({data?.available_orders?.length || 0})
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>

              {data?.available_orders && data.available_orders.length > 0 ? (
                <div className="space-y-4">
                  {data.available_orders.slice(0, 3).map((order) => (
                    <div
                      key={order.id}
                      className="border border-border rounded-xl p-4 bg-white hover:border-primary/40 transition-all space-y-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h4 className="font-extrabold text-foreground text-base">
                            {order.restaurant.name}
                          </h4>
                          <p className="text-xs text-gray-text mt-0.5">
                            Order Value: {formatCurrency(order.total_amount)}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <span className="font-extrabold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 text-sm">
                            Fee {formatCurrency(order.delivery_fee)}
                          </span>
                          <OrderExpiryCountdown expiresAt={order.expires_at} onExpired={refreshAll} />
                        </div>
                      </div>

                      <div className="flex items-center gap-2 pt-2">
                        <button
                          type="button"
                          onClick={() => handleAcceptOrder(order.id)}
                          disabled={actionLoadingId === order.id}
                          className="flex-1 bg-primary hover:bg-primary-hover text-white text-xs font-extrabold py-2.5 rounded-lg flex items-center justify-center gap-1 transition-colors disabled:opacity-60 cursor-pointer"
                        >
                          {actionLoadingId === order.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            "Accept Order"
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRejectOrder(order.id)}
                          disabled={actionLoadingId === order.id}
                          className="flex-1 bg-section hover:bg-gray-200 text-gray-700 text-xs font-bold py-2.5 rounded-lg border border-border transition-colors disabled:opacity-60 cursor-pointer"
                        >
                          Decline
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center text-gray-text">
                  <Navigation className="w-12 h-12 text-muted mx-auto mb-3 opacity-40" />
                  <p className="font-bold text-foreground text-sm mb-1">No Orders Available</p>
                  <p className="text-xs text-muted max-w-xs mx-auto">
                    {isOnline
                      ? "We are searching for nearby orders in your zone. Please keep your app open."
                      : "Turn on your duty status to start seeing nearby delivery requests."}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 8. Quick Actions Card Grid */}
        <div className="bg-white border border-border rounded-2xl p-6 shadow-card">
          <h3 className="text-base font-extrabold text-foreground mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <button
              type="button"
              onClick={handleToggleOnline}
              disabled={toggling}
              className="flex flex-col items-center justify-center p-4 rounded-xl border border-border bg-white hover:bg-section hover:border-primary/40 transition-all text-center group cursor-pointer"
            >
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center mb-2.5 transition-transform group-hover:scale-105 ${
                  isOnline
                    ? "bg-red-50 text-red-600 border border-red-200"
                    : "bg-emerald-50 text-emerald-600 border border-emerald-200"
                }`}
              >
                <Power className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-foreground">
                {isOnline ? "Go Offline" : "Go Online"}
              </span>
            </button>

            <Link
              href="/delivery/orders?tab=available"
              className="flex flex-col items-center justify-center p-4 rounded-xl border border-border bg-white hover:bg-section hover:border-primary/40 transition-all text-center group"
            >
              <div className="w-10 h-10 rounded-xl bg-primary-soft text-primary flex items-center justify-center mb-2.5 transition-transform group-hover:scale-105 border border-primary/20">
                <Package className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-foreground">Available Orders</span>
            </Link>

            <Link
              href="/delivery/orders?tab=accepted"
              className="flex flex-col items-center justify-center p-4 rounded-xl border border-border bg-white hover:bg-section hover:border-primary/40 transition-all text-center group"
            >
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-2.5 transition-transform group-hover:scale-105 border border-blue-200">
                <CheckSquare className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-foreground">Active Deliveries</span>
            </Link>

            <Link
              href="/delivery/wallet"
              className="flex flex-col items-center justify-center p-4 rounded-xl border border-border bg-white hover:bg-section hover:border-primary/40 transition-all text-center group"
            >
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-2.5 transition-transform group-hover:scale-105 border border-purple-200">
                <Wallet className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-foreground">Check Wallet</span>
            </Link>

            <Link
              href="/delivery/earnings"
              className="flex flex-col items-center justify-center p-4 rounded-xl border border-border bg-white hover:bg-section hover:border-primary/40 transition-all text-center group"
            >
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-2.5 transition-transform group-hover:scale-105 border border-emerald-200">
                <TrendingUp className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-foreground">View Earnings</span>
            </Link>

            <Link
              href="/delivery/profile"
              className="flex flex-col items-center justify-center p-4 rounded-xl border border-border bg-white hover:bg-section hover:border-primary/40 transition-all text-center group"
            >
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-2.5 transition-transform group-hover:scale-105 border border-amber-200">
                <User className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-foreground">Edit Profile</span>
            </Link>
          </div>
        </div>
      </div>
    </DeliveryShell>
  );
}
