import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { getAccessToken, setAccessToken } from '@/lib/accessToken';
import { clearClientAuth, markAuthenticated } from '@/lib/authSession';

/** Known production API — used when Vercel env is missing at build time. */
const PRODUCTION_API_FALLBACK = 'https://foodiq-2.onrender.com';

const getApiBaseUrl = () => {
  const envUrl = (process.env.NEXT_PUBLIC_API_URL || '').trim();
  if (!envUrl || envUrl.includes('foodiq-backend-api.onrender.com') || (process.env.NODE_ENV === 'production' && envUrl.includes('localhost'))) {
    return PRODUCTION_API_FALLBACK;
  }
  return envUrl;
};

const apiBaseUrl = getApiBaseUrl();

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
  (config) => {
    if (typeof window !== 'undefined') {
      const token = getAccessToken();
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
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
        url.includes('/api/monitoring/client-error');
      if (!skipNoise) {
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

export const fetcher = (url: string) =>
  api.get(url).then((res) => {
    const body = res.data;
    if (body && typeof body === "object" && "data" in body && body.data !== undefined) {
      return body.data;
    }
    return body;
  });

export default api;
