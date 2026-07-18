/**
 * In-memory access JWT — never persisted to localStorage or document.cookie.
 * REST also relies on httpOnly cookies (withCredentials). Memory backs Socket.IO auth.
 */

let accessToken: string | null = null;

export function getAccessToken(): string | null {
  return accessToken;
}

export function setAccessToken(token: string | null | undefined) {
  accessToken = token ? String(token) : null;
}

export function clearAccessToken() {
  accessToken = null;
}
