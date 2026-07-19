"use client";

import { io, type Socket } from "socket.io-client";
import { getAccessToken } from "@/lib/accessToken";
import { isClientAuthenticated } from "@/lib/authSession";

let socket: Socket | null = null;
let connecting = false;

function apiBaseUrl() {
  return (
    process.env.NEXT_PUBLIC_API_URL ||
    (process.env.NODE_ENV === "production"
      ? "https://foodiq-2.onrender.com"
      : "http://localhost:4000")
  );
}

/**
 * Singleton Socket.IO client. Auto-reconnects; auth via in-memory JWT
 * and/or httpOnly cookie (withCredentials) parsed server-side.
 */
export function getSocket(): Socket | null {
  if (typeof window === "undefined") return null;

  if (!isClientAuthenticated() && !getAccessToken()) {
    disconnectSocket();
    return null;
  }

  const token = getAccessToken() || undefined;

  if (socket?.connected) return socket;

  if (!socket && !connecting) {
    connecting = true;
    socket = io(apiBaseUrl(), {
      autoConnect: true,
      withCredentials: true,
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 8000,
      timeout: 15000,
      auth: token ? { token } : {},
    });

    socket.on("connect", () => {
      connecting = false;
      const t = getAccessToken();
      if (t && socket) socket.auth = { token: t };
    });

    socket.on("connect_error", (err) => {
      connecting = false;
      if (err.message === "UNAUTHORIZED" || err.message.includes("UNAUTHORIZED")) {
        disconnectSocket();
      }
    });

    socket.on("forceDisconnect", () => {
      disconnectSocket();
    });

    socket.on("disconnect", () => {
      connecting = false;
    });
  }

  if (socket && !socket.connected) {
    if (token) socket.auth = { token };
    if (!socket.active) socket.connect();
  }

  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
  }
  connecting = false;
}

export function isSocketConnected() {
  return Boolean(socket?.connected);
}
