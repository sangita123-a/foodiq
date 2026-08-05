"use client";

import useSWR from "swr";
import { useAuthToken } from "@/hooks/useAuthToken";
import {
  fetchUnifiedTickets,
  fetchUnifiedTicketDetail,
  fetchSupportCenterAnalytics,
  fetchAgentPerformance,
  type UnifiedTicketFilters,
} from "@/services/supportCenterApi";

export function useSupportTicketList(filters: UnifiedTicketFilters) {
  const hasToken = useAuthToken();
  const key = hasToken ? `support-center:tickets:${JSON.stringify(filters)}` : null;
  return useSWR(key, () => fetchUnifiedTickets(filters), {
    revalidateOnFocus: false,
    refreshInterval: 30000,
  });
}

export function useSupportTicketDetail(id: string | null, source: "ticket" | "partner" | null) {
  const hasToken = useAuthToken();
  const key = hasToken && id && source ? `support-center:ticket:${source}:${id}` : null;
  return useSWR(key, () => fetchUnifiedTicketDetail(id as string, source as "ticket" | "partner"), {
    revalidateOnFocus: false,
  });
}

export function useSupportCenterAnalytics() {
  const hasToken = useAuthToken();
  return useSWR(hasToken ? "support-center:analytics" : null, fetchSupportCenterAnalytics, {
    revalidateOnFocus: false,
    refreshInterval: 30000,
  });
}

export function useAgentPerformance() {
  const hasToken = useAuthToken();
  return useSWR(hasToken ? "support-center:agent-performance" : null, fetchAgentPerformance, {
    revalidateOnFocus: false,
  });
}
