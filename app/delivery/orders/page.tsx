"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { mutate } from "swr";
import {
  MapPin,
  Clock,
  Navigation,
  DollarSign,
  ShoppingBag,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Search,
  ArrowRight,
  Store,
  User,
  ExternalLink,
  Zap,
  Star,
  Wallet,
  CreditCard,
  SlidersHorizontal,
  WifiOff,
} from "lucide-react";
import DeliveryShell from "@/components/delivery/DeliveryShell";
import {
  useAssignedOrders,
  useAvailableOrders,
  useDeliveryDashboard,
} from "@/hooks/useDeliveryData";
import {
  acceptDeliveryOrder,
  formatCurrency,
  STATUS_LABELS,
  type DeliveryOrder,
} from "@/services/deliveryApi";

type SortKey = "nearest" | "earnings" | "newest" | "oldest";

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "nearest", label: "Nearest" },
  { value: "earnings", label: "Highest Earnings" },
  { value: "newest", label: "Newest" },
  { value: "oldest", label: "Oldest" },
];

type QuickFilter = "priority" | "express" | "cod" | "online";

const QUICK_FILTERS: { value: QuickFilter; label: string }[] = [
  { value: "priority", label: "Priority" },
  { value: "express", label: "Express" },
  { value: "cod", label: "COD" },
  { value: "online", label: "Online Paid" },
];

const PULL_THRESHOLD = 70;

export default function DeliveryOrdersPage() {
  const { data: dashboard } = useDeliveryDashboard();
  const {
    data: assigned,
    isLoading: isLoadingAssigned,
    error: assignedError,
    mutate: mutateAssigned,
  } = useAssignedOrders();
  const {
    data: available,
    isLoading: isLoadingAvailable,
    error: availableError,
    mutate: mutateAvailable,
  } = useAvailableOrders();

  const [acceptingId, setAcceptingId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"available" | "assigned">("available");
  const [searchQuery, setSearchQuery] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [sortBy, setSortBy] = useState<SortKey>("nearest");
  const [activeFilters, setActiveFilters] = useState<Set<QuickFilter>>(new Set());
  const [restaurantFilter, setRestaurantFilter] = useState("");
  const [zoneFilter, setZoneFilter] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  // Pull-to-refresh (mobile)
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const pullStartY = useRef<number | null>(null);
  const [pullDistance, setPullDistance] = useState(0);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await Promise.all([
      mutate("/api/delivery/dashboard"),
      mutateAvailable(),
      mutateAssigned(),
    ]);
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if ((scrollRef.current?.scrollTop ?? 0) > 0) return;
    pullStartY.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (pullStartY.current == null) return;
    const delta = e.touches[0].clientY - pullStartY.current;
    if (delta > 0) setPullDistance(Math.min(delta, 120));
  };

  const handleTouchEnd = async () => {
    if (pullDistance >= PULL_THRESHOLD) {
      await handleRefresh();
    }
    pullStartY.current = null;
    setPullDistance(0);
  };

  const handleAcceptOrder = async (orderId: string) => {
    try {
      setAcceptingId(orderId);
      setErrorMsg(null);
      setSuccessMsg(null);

      await acceptDeliveryOrder(orderId);

      setSuccessMsg("Order accepted successfully! Moving to assignments.");
      await handleRefresh();
      setActiveTab("assigned");
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : "Failed to accept order. It may have been claimed by another rider.";
      setErrorMsg(msg);
      // The order was likely claimed elsewhere or is no longer eligible — refresh the board.
      await mutateAvailable();
    } finally {
      setAcceptingId(null);
    }
  };

  const availableList = useMemo(() => available || [], [available]);
  const assignedList = assigned || [];

  const restaurantOptions = useMemo(() => {
    const names = new Set<string>();
    availableList.forEach((o) => {
      const name = typeof o.restaurant === "string" ? o.restaurant : o.restaurant_name || o.restaurant?.name;
      if (name) names.add(name);
    });
    return Array.from(names).sort();
  }, [availableList]);

  const zoneOptions = useMemo(() => {
    const names = new Set<string>();
    availableList.forEach((o) => {
      if (o.zone_name) names.add(o.zone_name);
    });
    return Array.from(names).sort();
  }, [availableList]);

  const toggleFilter = (filter: QuickFilter) => {
    setActiveFilters((prev) => {
      const next = new Set(prev);
      if (next.has(filter)) next.delete(filter);
      else next.add(filter);
      return next;
    });
  };

  const filteredAvailable = useMemo(() => {
    const query = searchQuery.toLowerCase();
    let list = availableList.filter((order) => {
      const restName =
        typeof order.restaurant === "string"
          ? order.restaurant
          : order.restaurant_name || order.restaurant?.name || "";
      const pickup = order.restaurant_address || "";
      const drop = order.customer_address || order.customer?.address || "";
      const matchesQuery =
        !query ||
        restName.toLowerCase().includes(query) ||
        pickup.toLowerCase().includes(query) ||
        drop.toLowerCase().includes(query);
      if (!matchesQuery) return false;

      if (restaurantFilter && restName !== restaurantFilter) return false;
      if (zoneFilter && order.zone_name !== zoneFilter) return false;

      if (activeFilters.has("priority") && !order.is_priority) return false;
      if (activeFilters.has("express") && !order.is_express) return false;
      if (activeFilters.has("cod") && order.payment_method !== "cod") return false;
      if (activeFilters.has("online") && order.payment_method === "cod") return false;

      return true;
    });

    list = [...list].sort((a, b) => {
      switch (sortBy) {
        case "nearest": {
          const aD = a.distance_km ?? Infinity;
          const bD = b.distance_km ?? Infinity;
          return aD - bD;
        }
        case "earnings":
          return (b.estimated_earnings || 0) - (a.estimated_earnings || 0);
        case "newest":
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case "oldest":
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        default:
          return 0;
      }
    });

    return list;
  }, [availableList, searchQuery, restaurantFilter, zoneFilter, activeFilters, sortBy]);

  const getRestaurantName = (order: DeliveryOrder) => {
    if (typeof order.restaurant === "string" && order.restaurant) {
      return order.restaurant;
    }
    return (
      order.restaurant_name ||
      (typeof order.restaurant === "object" ? order.restaurant?.name : "") ||
      "Partner Restaurant"
    );
  };

  const getPickupAddress = (order: DeliveryOrder) => {
    return (
      order.restaurant_address ||
      (typeof order.restaurant === "object" ? order.restaurant?.address : "") ||
      "Pickup location details upon acceptance"
    );
  };

  const getDropAddress = (order: DeliveryOrder) => {
    return (
      order.customer_address ||
      order.customer?.address ||
      "Delivery address details upon acceptance"
    );
  };

  const getCustomerName = (order: DeliveryOrder) => {
    return (
      order.customer_name ||
      order.customer?.name ||
      "Customer"
    );
  };

  return (
    <DeliveryShell title="Orders" online={dashboard?.is_online}>
      <div
        ref={scrollRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className="space-y-6 max-w-7xl mx-auto pb-12"
      >
        {/* Pull-to-refresh indicator (mobile) */}
        {pullDistance > 0 && (
          <div
            className="flex items-center justify-center text-primary transition-all overflow-hidden"
            style={{ height: Math.min(pullDistance, 60) }}
          >
            <RefreshCw
              className={`w-5 h-5 ${pullDistance >= PULL_THRESHOLD ? "animate-spin" : ""}`}
              style={{ transform: `rotate(${pullDistance * 3}deg)` }}
            />
          </div>
        )}

        {dashboard && !dashboard.is_online && (
          <div className="bg-amber-500/10 border border-amber-500/30 text-amber-700 rounded-2xl p-4 flex items-center gap-3 shadow-sm">
            <WifiOff className="w-5 h-5 shrink-0" />
            <p className="text-sm font-semibold">
              You&apos;re offline. Go online from your dashboard to see and accept available orders.
            </p>
          </div>
        )}

        {/* Top Notification Banner */}
        {errorMsg && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-600 rounded-2xl p-4 flex items-center justify-between gap-3 shadow-sm animate-in fade-in">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 shrink-0 text-red-500" />
              <p className="text-sm font-semibold">{errorMsg}</p>
            </div>
            <button
              onClick={() => setErrorMsg(null)}
              className="text-xs font-bold hover:underline shrink-0"
            >
              Dismiss
            </button>
          </div>
        )}

        {successMsg && (
          <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 rounded-2xl p-4 flex items-center justify-between gap-3 shadow-sm animate-in fade-in">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600" />
              <p className="text-sm font-semibold">{successMsg}</p>
            </div>
            <button
              onClick={() => setSuccessMsg(null)}
              className="text-xs font-bold hover:underline shrink-0"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Header & Controls Section */}
        <div className="bg-white border border-border rounded-2xl p-5 md:p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-foreground tracking-tight">
              Order Feed
            </h1>
            <p className="text-xs md:text-sm text-gray-text mt-1">
              Find available deliveries near you and track active assignments in real time.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Search Input */}
            <div className="relative flex-1 md:w-64">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-text" />
              <input
                type="text"
                placeholder="Search area, restaurant..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-section border border-border rounded-xl pl-9 pr-3 py-2 text-xs font-medium text-foreground placeholder:text-gray-text focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>

            {/* Filters toggle */}
            <button
              onClick={() => setShowFilters((v) => !v)}
              className={`px-3 py-2 border rounded-xl text-xs font-bold flex items-center gap-2 transition-all shrink-0 active:scale-95 ${
                showFilters || activeFilters.size > 0 || restaurantFilter || zoneFilter
                  ? "bg-primary/10 border-primary/30 text-primary"
                  : "bg-section hover:bg-border/60 text-foreground border-border"
              }`}
              title="Filters"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Filters</span>
              {activeFilters.size > 0 && (
                <span className="bg-primary text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px]">
                  {activeFilters.size}
                </span>
              )}
            </button>

            {/* Refresh Button */}
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="px-3 py-2 bg-section hover:bg-border/60 text-foreground border border-border rounded-xl text-xs font-bold flex items-center gap-2 transition-all shrink-0 active:scale-95"
              title="Refresh Orders"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-primary" : ""}`}
              />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <div className="bg-white border border-border rounded-2xl p-5 shadow-sm space-y-4 animate-in fade-in">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-extrabold text-gray-text uppercase tracking-wider mr-1">
                Sort:
              </span>
              {SORT_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setSortBy(opt.value)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    sortBy === opt.value
                      ? "bg-primary text-white"
                      : "bg-section text-gray-text hover:text-foreground border border-border"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-extrabold text-gray-text uppercase tracking-wider mr-1">
                Type:
              </span>
              {QUICK_FILTERS.map((f) => (
                <button
                  key={f.value}
                  onClick={() => toggleFilter(f.value)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    activeFilters.has(f.value)
                      ? "bg-primary text-white"
                      : "bg-section text-gray-text hover:text-foreground border border-border"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {restaurantOptions.length > 0 && (
                <select
                  value={restaurantFilter}
                  onChange={(e) => setRestaurantFilter(e.target.value)}
                  className="bg-section border border-border rounded-lg px-3 py-1.5 text-xs font-bold text-foreground"
                >
                  <option value="">All Restaurants</option>
                  {restaurantOptions.map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
                </select>
              )}
              {zoneOptions.length > 0 && (
                <select
                  value={zoneFilter}
                  onChange={(e) => setZoneFilter(e.target.value)}
                  className="bg-section border border-border rounded-lg px-3 py-1.5 text-xs font-bold text-foreground"
                >
                  <option value="">All Zones</option>
                  {zoneOptions.map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
                </select>
              )}
              {(activeFilters.size > 0 || restaurantFilter || zoneFilter) && (
                <button
                  onClick={() => {
                    setActiveFilters(new Set());
                    setRestaurantFilter("");
                    setZoneFilter("");
                  }}
                  className="text-xs font-bold text-primary hover:underline"
                >
                  Clear all
                </button>
              )}
            </div>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex gap-2 border-b border-border pb-1">
          <button
            onClick={() => setActiveTab("available")}
            className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2 ${
              activeTab === "available"
                ? "bg-primary text-white shadow-md shadow-primary/20"
                : "bg-white text-gray-text hover:bg-section hover:text-foreground border border-border/50"
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Available Orders</span>
            <span
              className={`text-xs px-2 py-0.5 rounded-full font-extrabold ${
                activeTab === "available"
                  ? "bg-white/20 text-white"
                  : "bg-primary/10 text-primary"
              }`}
            >
              {filteredAvailable.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("assigned")}
            className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2 ${
              activeTab === "assigned"
                ? "bg-primary text-white shadow-md shadow-primary/20"
                : "bg-white text-gray-text hover:bg-section hover:text-foreground border border-border/50"
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>My Assignments</span>
            <span
              className={`text-xs px-2 py-0.5 rounded-full font-extrabold ${
                activeTab === "assigned"
                  ? "bg-white/20 text-white"
                  : "bg-emerald-500/10 text-emerald-600"
              }`}
            >
              {assignedList.length}
            </span>
          </button>
        </div>

        {/* Tab Content: Available Orders */}
        {activeTab === "available" && (
          <div>
            {isLoadingAvailable ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="bg-white border border-border rounded-2xl p-5 space-y-4 animate-pulse"
                  >
                    <div className="h-6 bg-section rounded-lg w-3/4" />
                    <div className="h-4 bg-section rounded-lg w-1/2" />
                    <div className="h-16 bg-section rounded-xl" />
                    <div className="h-10 bg-section rounded-xl" />
                  </div>
                ))}
              </div>
            ) : availableError ? (
              <div className="bg-white border border-red-200 rounded-2xl p-12 text-center max-w-md mx-auto shadow-sm">
                <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4 text-red-500">
                  <AlertCircle className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-black text-foreground">Couldn&apos;t Load Orders</h3>
                <p className="text-xs text-gray-text mt-1 max-w-xs mx-auto">
                  Something went wrong while fetching the order feed. Check your connection and try again.
                </p>
                <button
                  onClick={() => mutateAvailable()}
                  className="mt-5 px-4 py-2 bg-primary text-white text-xs font-bold rounded-xl hover:bg-primary/90 transition-all shadow-sm"
                >
                  Retry
                </button>
              </div>
            ) : filteredAvailable.length === 0 ? (
              <div className="bg-white border border-border rounded-2xl p-12 text-center max-w-md mx-auto shadow-sm">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 text-primary">
                  <ShoppingBag className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-black text-foreground">
                  {availableList.length === 0 ? "No Available Orders Nearby" : "No Orders Match Your Filters"}
                </h3>
                <p className="text-xs text-gray-text mt-1 max-w-xs mx-auto">
                  {availableList.length === 0
                    ? "New pickup requests appear automatically when restaurants finish preparing paid customer orders."
                    : "Try clearing a filter or searching a broader area."}
                </p>
                <button
                  onClick={
                    availableList.length === 0
                      ? handleRefresh
                      : () => {
                          setActiveFilters(new Set());
                          setRestaurantFilter("");
                          setZoneFilter("");
                          setSearchQuery("");
                        }
                  }
                  className="mt-5 px-4 py-2 bg-primary text-white text-xs font-bold rounded-xl hover:bg-primary/90 transition-all shadow-sm"
                >
                  {availableList.length === 0 ? "Check Again" : "Clear Filters"}
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredAvailable.map((order) => {
                  const restName = getRestaurantName(order);
                  const pickupAddress = getPickupAddress(order);
                  const dropAddress = getDropAddress(order);
                  const custName = getCustomerName(order);
                  const estEarnings = order.estimated_earnings || order.delivery_fee + 25;
                  const isProcessingThis = acceptingId === order.id;

                  return (
                    <div
                      key={order.id}
                      className={`bg-white border rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group relative overflow-hidden ${
                        order.is_priority
                          ? "border-amber-400/60 hover:border-amber-500"
                          : "border-border hover:border-primary/40"
                      }`}
                    >
                      {/* Top Accent Gradient Bar */}
                      <div
                        className={`absolute top-0 left-0 right-0 h-1.5 opacity-90 ${
                          order.is_priority
                            ? "bg-gradient-to-r from-amber-500 to-red-500"
                            : "bg-gradient-to-r from-primary to-amber-500"
                        }`}
                      />

                      <div className="space-y-4 pt-1">
                        {/* Badges row */}
                        {(order.is_priority || order.is_express || order.zone_name) && (
                          <div className="flex flex-wrap items-center gap-1.5">
                            {order.is_priority && (
                              <span className="inline-flex items-center gap-1 bg-amber-500/15 text-amber-700 border border-amber-500/30 px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase animate-pulse">
                                <Star className="w-3 h-3 fill-amber-600 text-amber-600" />
                                Priority
                              </span>
                            )}
                            {order.is_express && (
                              <span className="inline-flex items-center gap-1 bg-blue-500/15 text-blue-700 border border-blue-500/30 px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase">
                                <Zap className="w-3 h-3 fill-blue-600 text-blue-600" />
                                Express
                              </span>
                            )}
                            {order.zone_name && (
                              <span className="inline-flex items-center gap-1 bg-purple-500/10 text-purple-700 border border-purple-500/20 px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase">
                                <MapPin className="w-3 h-3" />
                                {order.zone_name}
                              </span>
                            )}
                          </div>
                        )}

                        {/* Header: Restaurant & Earnings */}
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="flex items-center gap-1.5 text-xs font-extrabold text-primary uppercase tracking-wider mb-0.5">
                              <Store className="w-3.5 h-3.5" />
                              <span>Ready for Pickup</span>
                            </div>
                            <h3 className="text-base font-black text-foreground group-hover:text-primary transition-colors line-clamp-1">
                              {restName}
                            </h3>
                          </div>

                          <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 px-3 py-1.5 rounded-xl text-right shrink-0">
                            <span className="text-[10px] font-bold uppercase block text-emerald-600 leading-tight">
                              Earnings{order.bonus ? ` (+₹${order.bonus} bonus)` : ""}
                            </span>
                            <span className="text-base font-black tracking-tight">
                              {formatCurrency(estEarnings)}
                            </span>
                          </div>
                        </div>

                        {/* Order Meta Pills */}
                        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-border/50 text-xs">
                          <span className="bg-section border border-border px-2.5 py-1 rounded-lg font-bold text-foreground flex items-center gap-1">
                            <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Total: {formatCurrency(order.total_amount)}</span>
                          </span>

                          <span className="bg-section border border-border px-2.5 py-1 rounded-lg font-bold text-gray-text flex items-center gap-1">
                            <Navigation className="w-3.5 h-3.5 text-primary" />
                            <span>{order.distance || "Distance unavailable"}</span>
                          </span>

                          <span className="bg-section border border-border px-2.5 py-1 rounded-lg font-bold text-gray-text flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-amber-500" />
                            <span>{order.estimated_delivery_time || "25 mins"}</span>
                          </span>

                          <span className="bg-section border border-border px-2.5 py-1 rounded-lg font-bold text-gray-text flex items-center gap-1">
                            {order.payment_method === "cod" ? (
                              <>
                                <Wallet className="w-3.5 h-3.5 text-orange-500" />
                                <span>COD</span>
                              </>
                            ) : (
                              <>
                                <CreditCard className="w-3.5 h-3.5 text-green-600" />
                                <span>Paid Online</span>
                              </>
                            )}
                          </span>

                          {order.item_count && (
                            <span className="bg-section border border-border px-2.5 py-1 rounded-lg font-bold text-gray-text flex items-center gap-1">
                              <ShoppingBag className="w-3.5 h-3.5 text-blue-500" />
                              <span>{order.item_count} items</span>
                            </span>
                          )}
                        </div>

                        {/* Location Details (Pickup & Drop) */}
                        <div className="space-y-2.5 bg-section/60 p-3.5 rounded-xl border border-border/60 text-xs">
                          {/* Pickup Location */}
                          <div className="flex items-start gap-2.5">
                            <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
                              <MapPin className="w-3.5 h-3.5" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-[10px] font-extrabold uppercase text-gray-text tracking-wider">
                                Pickup Address
                              </p>
                              <p className="font-bold text-foreground line-clamp-2 mt-0.5">
                                {pickupAddress}
                              </p>
                            </div>
                          </div>

                          <div className="border-t border-border/40 my-1" />

                          {/* Drop Location */}
                          <div className="flex items-start gap-2.5">
                            <div className="w-6 h-6 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                              <User className="w-3.5 h-3.5" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-[10px] font-extrabold uppercase text-gray-text tracking-wider">
                                Drop: {custName}
                              </p>
                              <p className="font-bold text-foreground line-clamp-2 mt-0.5">
                                {dropAddress}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Card Actions */}
                      <div className="mt-5 pt-3 border-t border-border flex items-center gap-2">
                        <button
                          type="button"
                          disabled={isProcessingThis || Boolean(acceptingId)}
                          onClick={() => handleAcceptOrder(order.id)}
                          className="flex-1 bg-primary hover:bg-primary/90 text-white font-extrabold text-xs py-2.5 px-4 rounded-xl transition-all shadow-md shadow-primary/20 flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
                        >
                          {isProcessingThis ? (
                            <>
                              <RefreshCw className="w-4 h-4 animate-spin" />
                              <span>Accepting...</span>
                            </>
                          ) : (
                            <>
                              <span>Accept Order</span>
                              <ArrowRight className="w-4 h-4" />
                            </>
                          )}
                        </button>

                        <Link
                          href={`/delivery/orders/${order.id}`}
                          className="px-3 py-2.5 border border-border hover:bg-section text-gray-text hover:text-foreground text-xs font-bold rounded-xl transition-all flex items-center justify-center"
                          title="View Order Details"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Tab Content: My Assignments */}
        {activeTab === "assigned" && (
          <div>
            {isLoadingAssigned ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {[1, 2].map((i) => (
                  <div
                    key={i}
                    className="bg-white border border-border rounded-2xl p-5 space-y-4 animate-pulse"
                  >
                    <div className="h-6 bg-section rounded-lg w-3/4" />
                    <div className="h-4 bg-section rounded-lg w-1/2" />
                    <div className="h-16 bg-section rounded-xl" />
                  </div>
                ))}
              </div>
            ) : assignedError ? (
              <div className="bg-white border border-red-200 rounded-2xl p-12 text-center max-w-md mx-auto shadow-sm">
                <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4 text-red-500">
                  <AlertCircle className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-black text-foreground">Couldn&apos;t Load Assignments</h3>
                <p className="text-xs text-gray-text mt-1 max-w-xs mx-auto">
                  Something went wrong while fetching your assignments. Try again.
                </p>
                <button
                  onClick={() => mutateAssigned()}
                  className="mt-5 px-4 py-2 bg-primary text-white text-xs font-bold rounded-xl hover:bg-primary/90 transition-all shadow-sm"
                >
                  Retry
                </button>
              </div>
            ) : assignedList.length === 0 ? (
              <div className="bg-white border border-border rounded-2xl p-12 text-center max-w-md mx-auto shadow-sm">
                <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-4 text-emerald-600">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-black text-foreground">No Active Assignments</h3>
                <p className="text-xs text-gray-text mt-1 max-w-xs mx-auto">
                  Accept available orders from the Available tab to start delivering.
                </p>
                <button
                  onClick={() => setActiveTab("available")}
                  className="mt-5 px-4 py-2 bg-primary text-white text-xs font-bold rounded-xl hover:bg-primary/90 transition-all shadow-sm"
                >
                  View Available Orders
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {assignedList.map((order) => {
                  const restName = getRestaurantName(order);
                  const dropAddress = getDropAddress(order);
                  const custName = getCustomerName(order);
                  const statusLabel =
                    STATUS_LABELS[order.assignment_status || ""] ||
                    order.assignment_status ||
                    order.order_status;

                  return (
                    <Link
                      key={order.id}
                      href={`/delivery/orders/${order.id}`}
                      className="block bg-white border border-border hover:border-primary/50 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all group relative overflow-hidden"
                    >
                      <div className="flex justify-between items-start gap-3 mb-3">
                        <div>
                          <p className="text-xs font-extrabold text-primary">
                            Order #{order.id.slice(0, 8)}
                          </p>
                          <h3 className="text-base font-black text-foreground group-hover:text-primary transition-colors">
                            {restName}
                          </h3>
                        </div>

                        <span className="text-[11px] font-extrabold px-3 py-1 rounded-xl bg-emerald-500/10 text-emerald-700 border border-emerald-500/20">
                          {statusLabel}
                        </span>
                      </div>

                      <div className="bg-section p-3 rounded-xl border border-border/50 text-xs space-y-1.5 my-3">
                        <p className="text-gray-text">
                          <strong className="text-foreground">Drop to {custName}:</strong>{" "}
                          {dropAddress}
                        </p>
                        <p className="text-gray-text">
                          <strong className="text-foreground">Total:</strong>{" "}
                          {formatCurrency(order.total_amount)}
                        </p>
                      </div>

                      <div className="flex items-center justify-between text-xs font-bold text-primary pt-2 border-t border-border">
                        <span>Open Details & Navigation</span>
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </DeliveryShell>
  );
}
