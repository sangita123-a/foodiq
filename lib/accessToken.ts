/**
 * Access JWT — kept in memory and localStorage for SPA auth + Socket.IO.
 * httpOnly cookies are also set by the backend when credentials are included.
 */

const TOKEN_KEY = "foodiq_token";

let accessToken: string | null = null;

function readStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function getAccessToken(): string | null {
  if (accessToken) return accessToken;
  const stored = readStoredToken();
  if (stored) {
    accessToken = stored;
    return stored;
  }
  return null;
}

export function setAccessToken(token: string | null | undefined) {
  accessToken = token ? String(token) : null;
  if (typeof window === "undefined") return;
  try {
    if (accessToken) localStorage.setItem(TOKEN_KEY, accessToken);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* ignore quota / private mode */
  }
}

export function clearAccessToken() {
  accessToken = null;
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* ignore */
  }
}
