"use client";

import { useSyncExternalStore } from "react";
import { getAccessToken } from "@/lib/accessToken";
import { hasSessionMarker } from "@/lib/authSession";

export {
  authCookieOptions,
  clearClientAuth,
  isClientAuthenticated,
  markAuthenticated,
  notifyAuthChanged,
} from "@/lib/authSession";

function subscribeAuth(onStoreChange: () => void) {
  if (typeof window === "undefined") return () => {};
  const handler = () => onStoreChange();
  window.addEventListener("storage", handler);
  window.addEventListener("foodiq:auth", handler);
  return () => {
    window.removeEventListener("storage", handler);
    window.removeEventListener("foodiq:auth", handler);
  };
}

function getAuthSnapshot() {
  return Boolean(getAccessToken() || hasSessionMarker());
}

function getServerAuthSnapshot() {
  return false;
}

export function useAuthToken() {
  return useSyncExternalStore(subscribeAuth, getAuthSnapshot, getServerAuthSnapshot);
}
