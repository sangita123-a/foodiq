import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { getAccessToken, setAccessToken } from '@/lib/accessToken';
import { clearClientAuth, markAuthenticated } from '@/lib/authSession';

/** Known production API — used when Vercel env is missing at build time. */
const PRODUCTION_API_FALLBACK = 'https://foodiq-2.onrender.com';
const LOCAL_DEV_API = 'http://localhost:4000';

const getApiBaseUrl = () => {
  const envUrl = (process.env.NEXT_PUBLIC_API_URL || '').trim().replace(/\/$/, '');

  // Local dev: prefer local backend unless NEXT_PUBLIC_API_FORCE_REMOTE=true
  if (process.env.NODE_ENV === 'development') {
    const forceRemote =
      String(process.env.NEXT_PUBLIC_API_FORCE_REMOTE || '').toLowerCase() === 'true';
    if (!forceRemote) {
      if (envUrl.includes('localhost') || envUrl.includes('127.0.0.1')) {
        return envUrl;
      }
      return LOCAL_DEV_API;
    }
  }

  if (
    !envUrl ||
    envUrl.includes('foodiq-backend-api.onrender.com') ||
    (process.env.NODE_ENV === 'production' && envUrl.includes('localhost'))
  ) {
    return PRODUCTION_API_FALLBACK;
  }
  return envUrl;
};

/** Resolved backend origin for rewrites / SSR (never empty). */
export function getResolvedApiBaseUrl(): string {
  return getApiBaseUrl();
}

/**
 * Browser requests use same-origin `/backend-api/*` when the configured API origin
 * differs from the page origin (avoids CORS + console noise on localhost prod builds).
 */
function getClientApiBaseUrl(): string | undefined {
  const resolved = getApiBaseUrl();
  if (typeof window !== 'undefined') {
    if (process.env.NODE_ENV === 'development') {
      return '/backend-api';
    }
    try {
      const apiOrigin = new URL(resolved).origin;
      if (apiOrigin !== window.location.origin) {
        return '/backend-api';
      }
    } catch {
      return '/backend-api';
    }
  }
  return resolved || undefined;
}

const apiBaseUrl = getClientApiBaseUrl();

const api = axios.create({
  baseURL: apiBaseUrl || undefined,
  // Render free tier cold-starts can exceed 10s
  timeout: 45000,
  withCredentials: true,
});

const CSRF_COOKIE = 'foodiq_csrf';

function readCookie(name: string): string | undefined {
  if (typeof document === 'undefined') return undefined;
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : undefined;
}

let csrfBootstrapPromise: Promise<void> | null = null;

/** Prefetch a safe GET so production CSRF cookie is set before mutating requests. */
async function ensureCsrfCookie(): Promise<void> {
  if (typeof document === 'undefined') return;
  if (readCookie(CSRF_COOKIE)) return;
  if (!csrfBootstrapPromise) {
    const base = apiBaseUrl || '';
    csrfBootstrapPromise = fetch(`${base}/api/site-settings`, { credentials: 'include' })
      .then(() => undefined)
      .catch(() => undefined)
      .finally(() => {
        csrfBootstrapPromise = null;
      });
  }
  await csrfBootstrapPromise;
}

type RetryConfig = InternalAxiosRequestConfig & { _retry?: boolean };

let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  if (!refreshPromise) {
    refreshPromise = api
      .post('/api/auth/refresh', {})
      .then((res) => {
        const token = res.data?.data?.token as string | undefined;
        if (token) {
          setAccessToken(token);
          markAuthenticated(token);
          return token;
        }
        return null;
      })
      .catch(() => null)
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

// Request interceptor: Bearer from memory + CSRF for cookie sessions
api.interceptors.request.use(
  async (config) => {
    if (typeof window !== 'undefined') {
      const method = (config.method || 'get').toUpperCase();
      const url = String(config.url || '');
      const isAuthCredentialCall =
        url.includes('/api/auth/login') ||
        url.includes('/api/auth/register') ||
        url.includes('/api/delivery/register');
      const token = getAccessToken();
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      } else if (
        ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method) &&
        !readCookie(CSRF_COOKIE) &&
        !isAuthCredentialCall
      ) {
        await ensureCsrfCookie();
      }
      const csrf = readCookie(CSRF_COOKIE);
      if (csrf && config.headers) {
        config.headers['X-CSRF-Token'] = csrf;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    if (error.code === 'ECONNABORTED') {
      error.message = 'Request timed out. Please try again.';
    } else if (!error.response && error.message === 'Network Error') {
      error.message = 'Cannot reach the server. Please check your backend connection.';
    }

    const original = error.config as RetryConfig | undefined;
    const status = error.response?.status;
    const requestUrl = original?.url || '';
    const isRefreshCall = requestUrl.includes('/api/auth/refresh');
    const isAuthCredentialCall =
      requestUrl.includes('/api/auth/login') ||
      requestUrl.includes('/api/auth/register') ||
      requestUrl.includes('/api/delivery/register');

    if (
      status === 401 &&
      original &&
      !original._retry &&
      !isRefreshCall &&
      !isAuthCredentialCall &&
      typeof window !== 'undefined'
    ) {
      original._retry = true;
      const newToken = await refreshAccessToken();
      if (newToken) {
        original.headers = original.headers || {};
        original.headers.Authorization = `Bearer ${newToken}`;
        return api(original);
      }
    }

    if (typeof window !== 'undefined') {
      const url = error.config?.url || '';
      const skipNoise =
        status === 401 ||
        status === 403 ||
        url.includes('/api/monitoring/client-error') ||
        url.includes('/api/monitoring/');
      if (!skipNoise && error.response) {
        void import('@/lib/monitoring/client').then(({ trackApiFailure }) => {
          trackApiFailure({
            url,
            method: error.config?.method,
            status,
            message: error.message,
            code: error.code,
          });
        });
      }
    }

    if (status === 401 && typeof window !== 'undefined') {
      const path = window.location.pathname;
      const isAuthPage =
        path.startsWith('/login') ||
        path.startsWith('/register') ||
        path.startsWith('/partner/login') ||
        path.startsWith('/admin/login') ||
        path.startsWith('/delivery/login') ||
        path.startsWith('/delivery/register');

      if (!isAuthPage && !isAuthCredentialCall && !isRefreshCall) {
        clearClientAuth();
        const loginPath = path.startsWith('/admin')
          ? '/admin/login'
          : path.startsWith('/delivery')
            ? '/delivery/login'
            : path.startsWith('/partner')
              ? '/partner/login'
              : '/login';
        window.location.href = loginPath;
      }
    }
    return Promise.reject(error);
  }
);

export const fetcher = async (url: string) => {
  try {
    // Browser GET: use fetch to avoid axios interceptor deadlocks on parallel SWR keys.
    if (typeof window !== "undefined" && (!url.includes("_method="))) {
      const base = getClientApiBaseUrl() || "";
      const headers: Record<string, string> = { Accept: "application/json" };
      const token = getAccessToken();
      if (token) headers.Authorization = `Bearer ${token}`;
      const res = await fetch(`${base}${url}`, { credentials: "include", headers });
      if (!res.ok) {
        const err = new Error(`HTTP ${res.status}`) as Error & { response?: { status: number } };
        err.response = { status: res.status };
        throw err;
      }
      const body = await res.json();
      if (body && typeof body === "object" && "data" in body && body.data !== undefined) {
        return body.data;
      }
      return body;
    }

    const res = await api.get(url);
    const body = res.data;
    if (body && typeof body === "object" && "data" in body && body.data !== undefined) {
      return body.data;
    }
    return body;
  } catch (error) {
    // Graceful fallback — prevents dev overlay crashes when API is offline/CORS-blocked
    if (process.env.NODE_ENV === "development") {
      console.warn("[foodiq] API fetch failed:", url, error);
    }
    return undefined;
  }
};

export default api;
