"use client";

import { useEffect, useState } from "react";
import { getSocket, disconnectSocket, isSocketConnected } from "@/lib/socket";
import { useAuthToken } from "@/hooks/useAuthToken";
import type { Socket } from "socket.io-client";

/**
 * Connects Socket.IO when the user has a JWT. Auto-reconnect is handled by the client.
 */
export function useSocket() {
  const hasToken = useAuthToken();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [offline, setOffline] = useState(
    typeof navigator !== "undefined" ? !navigator.onLine : false
  );

  useEffect(() => {
    const onOnline = () => setOffline(false);
    const onOffline = () => setOffline(true);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []);

  useEffect(() => {
    if (!hasToken) {
      disconnectSocket();
      setSocket(null);
      setConnected(false);
      return;
    }

    const s = getSocket();
    setSocket(s);
    if (!s) return;

    const onConnect = () => setConnected(true);
    const onDisconnect = () => setConnected(false);

    s.on("connect", onConnect);
    s.on("disconnect", onDisconnect);
    setConnected(s.connected || isSocketConnected());

    return () => {
      s.off("connect", onConnect);
      s.off("disconnect", onDisconnect);
    };
  }, [hasToken]);

  return { socket, connected, offline };
}
