"use client";

import { useEffect } from "react";
import api from "@/services/api";
import { getAccessToken } from "@/lib/accessToken";
import { clearClientAuth, hasSessionMarker, markAuthenticated } from "@/lib/authSession";

/**
 * After a full page reload, restore in-memory access JWT via httpOnly refresh cookie.
 */
export default function AuthBootstrap() {
  useEffect(() => {
    if (!hasSessionMarker() || getAccessToken()) return;

    let cancelled = false;
    (async () => {
      try {
        const res = await api.post("/api/auth/refresh", {});
        const token = (res.data?.token || res.data?.data?.token) as string | undefined;
        if (!cancelled && token) markAuthenticated(token);
        else if (!cancelled) clearClientAuth();
      } catch {
        if (!cancelled) clearClientAuth();
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}
