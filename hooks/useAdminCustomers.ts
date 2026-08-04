"use client";

import { useEffect, useState } from "react";
import useSWR from "swr";
import { useAuthToken } from "@/hooks/useAuthToken";
import { getSocket } from "@/lib/socket";
import {
  customerFetcher,
  type CustomerFilters,
  type CustomerListResponse,
  type CustomerStats,
  type Customer,
  type SavedAddress,
  type CustomerOrder,
  type WalletTransaction,
  type RefundRecord,
  type LoyaltyInfo,
  type CustomerSupportTicket,
  type CustomerReview,
  type NotificationPreferences,
} from "@/services/customerAdminApi";

export function useCustomerStats() {
  const hasToken = useAuthToken();
  return useSWR<CustomerStats>(
    hasToken ? "/api/admin/customers/stats" : null,
    customerFetcher,
    {
      revalidateOnFocus: false,
      refreshInterval: 30000,
    }
  );
}

export function useCustomerList(filters: CustomerFilters) {
  const hasToken = useAuthToken();
  const params = new URLSearchParams();
  if (filters.search) params.set("search", filters.search);
  if (filters.status) params.set("status", filters.status);
  if (filters.verification) params.set("verification", filters.verification);
  if (filters.city) params.set("city", filters.city);
  if (filters.state) params.set("state", filters.state);
  if (filters.startDate) params.set("startDate", filters.startDate);
  if (filters.endDate) params.set("endDate", filters.endDate);
  if (filters.orderRange) params.set("orderRange", filters.orderRange);
  if (filters.isPremium) params.set("isPremium", filters.isPremium);
  if (filters.sortBy) params.set("sortBy", filters.sortBy);
  if (filters.page) params.set("page", String(filters.page));
  if (filters.limit) params.set("limit", String(filters.limit));

  const q = params.toString();
  const path = `/api/admin/customers${q ? `?${q}` : ""}`;

  const swr = useSWR<CustomerListResponse>(hasToken ? path : null, customerFetcher, {
    revalidateOnFocus: false,
    keepPreviousData: true,
  });

  return { ...swr, path };
}

export function useCustomerProfile(customerId: string | null) {
  const hasToken = useAuthToken();
  return useSWR<Customer>(
    hasToken && customerId ? `/api/admin/customers/${customerId}` : null,
    customerFetcher,
    { revalidateOnFocus: false }
  );
}

export function useCustomerAddresses(customerId: string | null) {
  const hasToken = useAuthToken();
  return useSWR<SavedAddress[]>(
    hasToken && customerId ? `/api/admin/customers/${customerId}/addresses` : null,
    customerFetcher,
    { revalidateOnFocus: false }
  );
}

export function useCustomerOrders(customerId: string | null, statusFilter?: string) {
  const hasToken = useAuthToken();
  const path = customerId
    ? `/api/admin/customers/${customerId}/orders${statusFilter ? `?status=${statusFilter}` : ""}`
    : null;
  return useSWR<CustomerOrder[]>(hasToken ? path : null, customerFetcher, {
    revalidateOnFocus: false,
  });
}

export function useCustomerWallet(customerId: string | null) {
  const hasToken = useAuthToken();
  return useSWR<{
    balance: number;
    transactions: WalletTransaction[];
    refunds: RefundRecord[];
  }>(hasToken && customerId ? `/api/admin/customers/${customerId}/wallet` : null, customerFetcher, {
    revalidateOnFocus: false,
  });
}

export function useCustomerLoyalty(customerId: string | null) {
  const hasToken = useAuthToken();
  return useSWR<LoyaltyInfo>(
    hasToken && customerId ? `/api/admin/customers/${customerId}/loyalty` : null,
    customerFetcher,
    { revalidateOnFocus: false }
  );
}

export function useCustomerSupport(customerId: string | null) {
  const hasToken = useAuthToken();
  return useSWR<CustomerSupportTicket[]>(
    hasToken && customerId ? `/api/admin/customers/${customerId}/support` : null,
    customerFetcher,
    { revalidateOnFocus: false }
  );
}

export function useCustomerReviews(customerId: string | null) {
  const hasToken = useAuthToken();
  return useSWR<CustomerReview[]>(
    hasToken && customerId ? `/api/admin/customers/${customerId}/reviews` : null,
    customerFetcher,
    { revalidateOnFocus: false }
  );
}

export function useCustomerFavorites(customerId: string | null) {
  const hasToken = useAuthToken();
  return useSWR<{
    favoriteRestaurants: Array<{ id: string; name: string; cuisine: string; rating: number; imageUrl: string }>;
    favoriteFoods: Array<{ id: string; name: string; price: number; restaurantName: string; imageUrl: string }>;
    wishlist: Array<{ id: string; name: string; price: number; restaurantName: string }>;
  }>(hasToken && customerId ? `/api/admin/customers/${customerId}/favorites` : null, customerFetcher, {
    revalidateOnFocus: false,
  });
}

export function useCustomerNotifications(customerId: string | null) {
  const hasToken = useAuthToken();
  return useSWR<NotificationPreferences>(
    hasToken && customerId ? `/api/admin/customers/${customerId}/notifications` : null,
    customerFetcher,
    { revalidateOnFocus: false }
  );
}

export function useCustomerRealtimeUpdates() {
  const [onlineCustomersCount, setOnlineCustomersCount] = useState<number>(42);
  const [liveEvents, setLiveEvents] = useState<Array<{ id: string; message: string; timestamp: string }>>([]);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleNewRegistration = (data: { customerName?: string; email?: string }) => {
      const msg = `New customer registered: ${data.customerName || data.email || "Guest"}`;
      setLiveEvents((prev) => [
        { id: String(Date.now()), message: msg, timestamp: new Date().toLocaleTimeString() },
        ...prev.slice(0, 9),
      ]);
      setOnlineCustomersCount((count) => count + 1);
    };

    const handleOnlineCount = (data: { count?: number }) => {
      if (typeof data.count === "number") {
        setOnlineCustomersCount(data.count);
      }
    };

    socket.on("customer:registered", handleNewRegistration);
    socket.on("customer:online_count", handleOnlineCount);

    return () => {
      socket.off("customer:registered", handleNewRegistration);
      socket.off("customer:online_count", handleOnlineCount);
    };
  }, []);

  return { onlineCustomersCount, liveEvents };
}
