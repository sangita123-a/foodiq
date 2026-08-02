"use client";

import { useState } from "react";
import Link from "next/link";
import { mutate } from "swr";
import {
  CheckCircle2,
  Clock,
  MapPin,
  Phone,
  Store,
  User,
  ShoppingBag,
  Navigation,
  RefreshCw,
  Search,
  AlertCircle,
  ChevronRight,
  ArrowRight,
  ShieldCheck,
  Truck,
  PackageCheck,
  Check,
  ExternalLink,
} from "lucide-react";
import DeliveryShell from "@/components/delivery/DeliveryShell";
import { useAssignedOrders } from "@/hooks/useDeliveryData";
import {
  reachRestaurantOrder,
  pickUpOrder,
  outForDeliveryOrder,
  deliverOrder,
  formatCurrency,
  formatRelativeTime,
  STATUS_LABELS,
  type DeliveryOrder,
} from "@/services/deliveryApi";

type WorkflowStep = {
  key: "assigned" | "reached_restaurant" | "picked_up" | "out_for_delivery" | "delivered";
  label: string;
  shortLabel: string;
  icon: typeof CheckCircle2;
};

const WORKFLOW_STEPS: WorkflowStep[] = [
  { key: "assigned", label: "Assigned", shortLabel: "Assigned", icon: CheckCircle2 },
  { key: "reached_restaurant", label: "Reached Restaurant", shortLabel: "At Restaurant", icon: Store },
  { key: "picked_up", label: "Food Picked Up", shortLabel: "Picked Up", icon: ShoppingBag },
  { key: "out_for_delivery", label: "Out For Delivery", shortLabel: "On The Way", icon: Truck },
  { key: "delivered", label: "Delivered", shortLabel: "Delivered", icon: PackageCheck },
];

function getStepIndex(status: string): number {
  const norm = (status || "").toLowerCase().replace(/\s+/g, "_");
  if (norm === "accepted" || norm === "assigned" || norm === "offered") return 0;
  if (norm === "reached_restaurant" || norm === "ready_for_pickup") return 1;
  if (norm === "picked_up") return 2;
  if (norm === "out_for_delivery" || norm === "on_the_way" || norm === "near_customer") return 3;
  if (norm === "delivered") return 4;
  return 0;
}

export default function AssignedOrdersPage() {
  const { data: assignedOrders, isLoading, error } = useAssignedOrders();
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await Promise.all([
      mutate("/api/delivery/orders/assigned"),
      mutate("/api/delivery/dashboard"),
    ]);
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const handleStatusUpdate = async (orderId: string, action: "reached" | "picked" | "out" | "deliver") => {
    try {
      setUpdatingId(orderId);
      setErrorMsg(null);
      setSuccessMsg(null);

      let updatedOrder: DeliveryOrder;
      if (action === "reached") {
        updatedOrder = await reachRestaurantOrder(orderId);
        setSuccessMsg("Status updated: Arrived at restaurant!");
      } else if (action === "picked") {
        updatedOrder = await pickUpOrder(orderId);
        setSuccessMsg("Status updated: Order picked up from restaurant!");
      } else if (action === "out") {
        updatedOrder = await outForDeliveryOrder(orderId);
        setSuccessMsg("Status updated: Out for delivery to customer!");
      } else {
        updatedOrder = await deliverOrder(orderId);
        setSuccessMsg("Order marked as delivered! Great job!");
      }

      await handleRefresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to update order status. Please check connectivity.";
      setErrorMsg(msg);
    } finally {
      setUpdatingId(null);
    }
  };

  const ordersList = assignedOrders || [];
  const filteredOrders = ordersList.filter((order) => {
    const restName = order.restaurant_name || order.restaurant?.name || "";
    const pickup = order.restaurant_address || order.restaurant?.address || "";
    const drop = order.customer_address || order.customer?.address || "";
    const custName = order.customer_name || order.customer?.name || "";
    const query = searchQuery.toLowerCase();
    return (
      restName.toLowerCase().includes(query) ||
      pickup.toLowerCase().includes(query) ||
      drop.toLowerCase().includes(query) ||
      custName.toLowerCase().includes(query) ||
      order.id.toLowerCase().includes(query)
    );
  });

  return (
    <DeliveryShell>
      <div className="space-y-6 pb-12">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
                <Truck className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-2xl font-black tracking-tight text-foreground">Assigned Orders</h1>
                <p className="text-sm font-medium text-muted-foreground">
                  Active delivery assignments requiring your execution & status updates
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 text-sm font-bold text-foreground hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin text-primary" : ""}`} />
              <span>Refresh</span>
            </button>

            <Link
              href="/delivery/orders"
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-sm font-bold hover:opacity-95 transition-opacity"
            >
              <span>Available Pool</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Search & Notifications */}
        <div className="space-y-4">
          {errorMsg && (
            <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/60 text-red-700 dark:text-red-300 flex items-start gap-3 text-sm font-medium">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <div className="flex-1">{errorMsg}</div>
              <button onClick={() => setErrorMsg(null)} className="text-red-500 hover:text-red-700 font-bold">
                ×
              </button>
            </div>
          )}

          {successMsg && (
            <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-emerald-700 dark:text-emerald-300 flex items-start gap-3 text-sm font-medium">
              <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5 text-emerald-600" />
              <div className="flex-1">{successMsg}</div>
              <button onClick={() => setSuccessMsg(null)} className="text-emerald-500 hover:text-emerald-700 font-bold">
                ×
              </button>
            </div>
          )}

          <div className="relative">
            <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search assigned orders by restaurant, customer, address, or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3.5 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 text-sm font-medium text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm"
            />
          </div>
        </div>

        {/* Loading Skeleton */}
        {isLoading && (
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <div
                key={i}
                className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 animate-pulse space-y-6"
              >
                <div className="h-6 bg-zinc-200 dark:bg-zinc-800 rounded w-1/3" />
                <div className="h-16 bg-zinc-100 dark:bg-zinc-800/50 rounded-xl" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="h-24 bg-zinc-100 dark:bg-zinc-800/50 rounded-xl" />
                  <div className="h-24 bg-zinc-100 dark:bg-zinc-800/50 rounded-xl" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-12 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-foreground">Failed to load assigned orders</h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              We encountered an issue communicating with the delivery server.
            </p>
            <button
              onClick={handleRefresh}
              className="px-5 py-2.5 rounded-xl bg-primary text-white text-sm font-bold shadow-sm hover:opacity-90 transition-opacity"
            >
              Retry
            </button>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && filteredOrders.length === 0 && (
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-12 text-center space-y-4 shadow-sm">
            <div className="w-16 h-16 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-400 flex items-center justify-center mx-auto">
              <ShoppingBag className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-foreground">No assigned orders found</h3>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                {searchQuery
                  ? "No assigned orders match your search criteria."
                  : "You currently have no active assigned orders. Check the available orders pool to claim new deliveries!"}
              </p>
            </div>
            {!searchQuery && (
              <Link
                href="/delivery/orders"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-white font-bold text-sm shadow-button hover:opacity-95 transition-opacity"
              >
                <span>Browse Available Orders</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            )}
          </div>
        )}

        {/* Assigned Orders List */}
        {!isLoading && !error && filteredOrders.length > 0 && (
          <div className="space-y-6">
            {filteredOrders.map((order) => {
              const orderId = order.id || order.order_id || "";
              const currentStatus = order.assignment_status || order.order_status || "assigned";
              const currentStepIdx = getStepIndex(currentStatus);

              const restaurantName = order.restaurant_name || order.restaurant?.name || "Restaurant";
              const restaurantAddress = order.restaurant_address || order.restaurant?.address || "Address unavailable";
              const customerName = order.customer_name || order.customer?.name || "Customer";
              const customerAddress = order.customer_address || order.customer?.address || "Address unavailable";
              const itemsList = order.items || order.order_items || [];

              return (
                <div
                  key={orderId}
                  className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden transition-all hover:border-zinc-300 dark:hover:border-zinc-700"
                >
                  {/* Card Header */}
                  <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-4 bg-zinc-50/50 dark:bg-zinc-900/50">
                    <div className="flex items-center gap-3">
                      <div className="px-3 py-1.5 rounded-lg bg-primary/10 text-primary font-mono font-bold text-xs">
                        #{orderId.slice(0, 8)}
                      </div>
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                        <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                        {STATUS_LABELS[currentStatus.toLowerCase()] || currentStatus}
                      </span>
                    </div>

                    <div className="flex items-center gap-4 text-xs font-medium text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" />
                        <span>Assigned {formatRelativeTime(order.assigned_at || order.created_at)}</span>
                      </div>
                      <div className="font-extrabold text-foreground text-sm">
                        {formatCurrency(order.total_amount)}
                      </div>
                      <div className="px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 font-bold uppercase text-[10px]">
                        {order.payment_status || "Paid"}
                      </div>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-6 space-y-6">
                    {/* Order Timeline Visual */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-xs font-bold text-muted-foreground uppercase tracking-wider">
                        <span>Order Timeline</span>
                        <span>Step {currentStepIdx + 1} of 5</span>
                      </div>

                      <div className="relative pt-2">
                        {/* Progress Bar Line */}
                        <div className="absolute top-[22px] left-4 right-4 h-1 bg-zinc-100 dark:bg-zinc-800 rounded-full">
                          <div
                            className="h-full bg-primary rounded-full transition-all duration-500"
                            style={{
                              width: `${(currentStepIdx / (WORKFLOW_STEPS.length - 1)) * 100}%`,
                            }}
                          />
                        </div>

                        {/* Step Nodes */}
                        <div className="relative flex justify-between items-start">
                          {WORKFLOW_STEPS.map((step, idx) => {
                            const isPassed = idx < currentStepIdx;
                            const isCurrent = idx === currentStepIdx;

                            return (
                              <div key={step.key} className="flex flex-col items-center group">
                                <div
                                  className={`w-9 h-9 rounded-full flex items-center justify-center border-2 text-xs font-bold transition-all ${
                                    isPassed
                                      ? "bg-primary border-primary text-white"
                                      : isCurrent
                                      ? "bg-white dark:bg-zinc-900 border-primary text-primary ring-4 ring-primary/20 scale-110 shadow-md"
                                      : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-400"
                                  }`}
                                >
                                  {isPassed ? <Check className="w-4 h-4 stroke-[3]" /> : idx + 1}
                                </div>
                                <span
                                  className={`mt-2 text-[11px] font-bold text-center transition-colors ${
                                    isCurrent
                                      ? "text-primary font-black"
                                      : isPassed
                                      ? "text-foreground"
                                      : "text-muted-foreground"
                                  }`}
                                >
                                  {step.shortLabel}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {/* Customer & Restaurant Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                      {/* Restaurant Info Card */}
                      <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/80 dark:border-zinc-800 space-y-3">
                        <div className="flex items-center justify-between border-b border-zinc-200/60 dark:border-zinc-800 pb-2">
                          <div className="flex items-center gap-2 text-xs font-bold text-primary uppercase tracking-wider">
                            <Store className="w-4 h-4" />
                            <span>Pickup Location (Restaurant)</span>
                          </div>
                          {order.restaurant?.phone && (
                            <a
                              href={`tel:${order.restaurant.phone}`}
                              className="text-xs font-bold text-primary flex items-center gap-1 hover:underline"
                            >
                              <Phone className="w-3 h-3" />
                              <span>Call</span>
                            </a>
                          )}
                        </div>

                        <div>
                          <h4 className="font-extrabold text-foreground text-sm">{restaurantName}</h4>
                          <p className="text-xs text-muted-foreground mt-0.5 flex items-start gap-1">
                            <MapPin className="w-3.5 h-3.5 shrink-0 text-zinc-400 mt-0.5" />
                            <span>{restaurantAddress}</span>
                          </p>
                        </div>

                        {order.restaurant?.lat && order.restaurant?.lng && (
                          <a
                            href={`https://www.google.com/maps/dir/?api=1&destination=${order.restaurant.lat},${order.restaurant.lng}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline pt-1"
                          >
                            <Navigation className="w-3.5 h-3.5" />
                            <span>Navigate to Pickup</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>

                      {/* Customer Info Card */}
                      <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/80 dark:border-zinc-800 space-y-3">
                        <div className="flex items-center justify-between border-b border-zinc-200/60 dark:border-zinc-800 pb-2">
                          <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                            <User className="w-4 h-4" />
                            <span>Delivery Destination (Customer)</span>
                          </div>
                          {order.customer?.phone && (
                            <a
                              href={`tel:${order.customer.phone}`}
                              className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 hover:underline"
                            >
                              <Phone className="w-3 h-3" />
                              <span>Call Customer</span>
                            </a>
                          )}
                        </div>

                        <div>
                          <h4 className="font-extrabold text-foreground text-sm">{customerName}</h4>
                          <p className="text-xs text-muted-foreground mt-0.5 flex items-start gap-1">
                            <MapPin className="w-3.5 h-3.5 shrink-0 text-zinc-400 mt-0.5" />
                            <span>{customerAddress}</span>
                          </p>
                        </div>

                        {order.customer?.lat && order.customer?.lng && (
                          <a
                            href={`https://www.google.com/maps/dir/?api=1&destination=${order.customer.lat},${order.customer.lng}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline pt-1"
                          >
                            <Navigation className="w-3.5 h-3.5" />
                            <span>Navigate to Dropoff</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                    </div>

                    {/* Order Items & Instructions */}
                    <div className="bg-zinc-50/70 dark:bg-zinc-800/30 rounded-xl p-4 border border-zinc-100 dark:border-zinc-800 space-y-3">
                      <div className="flex items-center justify-between text-xs font-bold text-foreground">
                        <span className="flex items-center gap-1.5">
                          <ShoppingBag className="w-4 h-4 text-primary" />
                          Order Items ({itemsList.length || order.item_count || 1})
                        </span>
                        <span className="font-extrabold text-primary">
                          Est. Fee Earned: {formatCurrency(order.delivery_fee || 40)}
                        </span>
                      </div>

                      {itemsList.length > 0 ? (
                        <div className="divide-y divide-zinc-200/50 dark:divide-zinc-800 text-xs">
                          {itemsList.map((item: { name: string; quantity: number; price_at_time: number }, idx: number) => (
                            <div key={idx} className="py-2 flex items-center justify-between">
                              <span className="font-medium text-foreground">
                                {item.quantity}x {item.name}
                              </span>
                              <span className="font-mono text-muted-foreground">
                                {formatCurrency(Number(item.price_at_time || 0) * item.quantity)}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground italic">
                          Itemized list available upon order pickup verification.
                        </p>
                      )}

                      {order.delivery_instructions && (
                        <div className="mt-2 pt-2 border-t border-zinc-200/60 dark:border-zinc-800 text-xs text-amber-700 dark:text-amber-400 font-medium">
                          <strong>Note:</strong> &quot;{order.delivery_instructions}&quot;
                        </div>
                      )}
                    </div>

                    {/* Workflow Action Buttons */}
                    <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-4">
                      <div className="text-xs text-muted-foreground font-medium">
                        Click the active step button to progress the workflow safely.
                      </div>

                      <div className="flex items-center gap-3">
                        {/* Step 1: Reached Restaurant */}
                        {(currentStepIdx === 0) && (
                          <button
                            onClick={() => handleStatusUpdate(orderId, "reached")}
                            disabled={updatingId === orderId}
                            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm shadow-button transition-all disabled:opacity-50"
                          >
                            <Store className="w-4 h-4" />
                            <span>
                              {updatingId === orderId ? "Updating..." : "1. Mark Reached Restaurant"}
                            </span>
                          </button>
                        )}

                        {/* Step 2: Picked Up */}
                        {currentStepIdx === 1 && (
                          <button
                            onClick={() => handleStatusUpdate(orderId, "picked")}
                            disabled={updatingId === orderId}
                            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-button transition-all disabled:opacity-50"
                          >
                            <ShoppingBag className="w-4 h-4" />
                            <span>
                              {updatingId === orderId ? "Updating..." : "2. Mark Food Picked Up"}
                            </span>
                          </button>
                        )}

                        {/* Step 3: Out For Delivery */}
                        {currentStepIdx === 2 && (
                          <button
                            onClick={() => handleStatusUpdate(orderId, "out")}
                            disabled={updatingId === orderId}
                            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-sm shadow-button transition-all disabled:opacity-50"
                          >
                            <Truck className="w-4 h-4" />
                            <span>
                              {updatingId === orderId ? "Updating..." : "3. Mark Out For Delivery"}
                            </span>
                          </button>
                        )}

                        {/* Step 4: OTP Verification & Delivery */}
                        {currentStepIdx === 3 && (
                          <Link
                            href={`/delivery/orders/verify?orderId=${orderId}`}
                            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-button transition-all"
                          >
                            <ShieldCheck className="w-4 h-4" />
                            <span>Verify Customer OTP & Deliver</span>
                          </Link>
                        )}

                        {/* Step 5: Completed */}
                        {currentStepIdx === 4 && (
                          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 font-bold text-sm">
                            <ShieldCheck className="w-4 h-4" />
                            <span>Delivery Completed</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </DeliveryShell>
  );
}
