import Cookies from "js-cookie";
import { getAccessToken, clearAccessToken, setAccessToken } from "@/lib/accessToken";
import { clearAuthUser } from "@/lib/authUser";

const SESSION_COOKIE = "foodiq_session";

export function authCookieOptions() {
  return {
    expires: 7,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
  };
}

export function notifyAuthChanged() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("foodiq:auth"));
  }
}

export function hasSessionMarker() {
  if (typeof document === "undefined") return false;
  return Boolean(Cookies.get(SESSION_COOKIE));
}

/** Store access JWT in memory only; set non-sensitive session marker cookie. */
export function markAuthenticated(accessJwt?: string | null) {
  if (accessJwt) setAccessToken(accessJwt);
  Cookies.set(SESSION_COOKIE, "1", authCookieOptions());
  notifyAuthChanged();
}

export function clearClientAuth() {
  clearAccessToken();
  clearAuthUser();
  Cookies.remove(SESSION_COOKIE);
  Cookies.remove("token");
  notifyAuthChanged();
}

export function isClientAuthenticated() {
  return Boolean(getAccessToken() || hasSessionMarker());
}
