"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import api from "@/services/api";
import { getAccessToken } from "@/lib/accessToken";
import { clearClientAuth, hasSessionMarker, markAuthenticated } from "@/lib/authSession";

/**
 * After a full page reload, restore in-memory access JWT via httpOnly refresh cookie.
 *
 * /api/auth/refresh only knows about `users`-table sessions (customer/admin/
 * restaurant partner). Delivery partners authenticate against a separate
 * `delivery_partners` table/JWT with no equivalent refresh cookie, so this
 * call would always fail there and wipe an otherwise-valid delivery session.
 */
export default function AuthBootstrap() {
  const pathname = usePathname();
  useEffect(() => {
    if (pathname?.startsWith("/delivery")) return;
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
  }, [pathname]);

  return null;
}
