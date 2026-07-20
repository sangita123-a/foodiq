"use client";

import useSWR from "swr";
import { useAuthToken } from "@/hooks/useAuthToken";
import { fetchLoyaltyOverview, loyaltyFetcher, type LoyaltyOverview } from "@/services/loyaltyApi";

export function useLoyaltyOverview() {
  const hasToken = useAuthToken();
  return useSWR<LoyaltyOverview>(
    hasToken ? "/api/loyalty/overview" : null,
    loyaltyFetcher,
    { revalidateOnFocus: false }
  );
}

export function useLoyaltyWallet() {
  const hasToken = useAuthToken();
  return useSWR(hasToken ? "/api/loyalty/wallet" : null, loyaltyFetcher, {
    revalidateOnFocus: false,
  });
}
