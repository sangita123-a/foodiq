import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000',
  timeout: 10000,
});

import Cookies from 'js-cookie';

// Request interceptor to add the JWT token
api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = Cookies.get('token');
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle errors globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.code === 'ECONNABORTED') {
      error.message = 'Request timed out. Please try again.';
    } else if (!error.response && error.message === 'Network Error') {
      error.message = 'Cannot reach the server. Make sure the backend is running on port 4000.';
    }

    if (error.response?.status === 401 && typeof window !== 'undefined') {
      const path = window.location.pathname;
      const isAuthPage = path.startsWith('/login') || path.startsWith('/register') || path.startsWith('/partner/login');
      const requestUrl = error.config?.url || '';
      const isAuthRequest = requestUrl.includes('/api/auth/login') || requestUrl.includes('/api/auth/register');

      if (!isAuthPage && !isAuthRequest) {
        Cookies.remove('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Generic SWR fetcher function
export const fetcher = (url: string) => api.get(url).then((res) => res.data.data);

export default api;
