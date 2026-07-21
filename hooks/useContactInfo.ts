"use client";

import useSWR from "swr";
import api from "@/services/api";
import {
  CONTACT_INFO_SWR_KEY,
  DEFAULT_CONTACT_INFO,
  mergeContactInfo,
  type ContactInfo,
} from "@/lib/contactInfo";

async function fetchContactInfo(): Promise<ContactInfo> {
  try {
    const res = await api.get("/api/contact");
    const data = res.data?.data ?? res.data;
    return mergeContactInfo(data);
  } catch {
    return DEFAULT_CONTACT_INFO;
  }
}

export function useContactInfo() {
  const { data, isLoading, error, mutate } = useSWR<ContactInfo>(
    CONTACT_INFO_SWR_KEY,
    fetchContactInfo,
    {
      revalidateOnFocus: true,
      dedupingInterval: 30000,
    }
  );

  return {
    contact: mergeContactInfo(data),
    isLoading,
    error,
    mutate,
  };
}
