import axios from 'axios';
import { clearSession, isTokenExpired } from '@/core/utils/authUtils';

const BASE_URL = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || '';

export const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// ─────────────────────────────────────────────────────────────────────────────
// Request Interceptor: Attach JWT Bearer Token
// ─────────────────────────────────────────────────────────────────────────────
apiClient.interceptors.request.use(
  (config) => {
    // Let the browser set Content-Type with dynamic multipart boundary for FormData
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }

    // Attach JWT bearer token from localStorage
    const token =
      localStorage.getItem('coop_access_token') ||
      (() => {
        try {
          const authData = localStorage.getItem('coop_auth_state');
          return authData ? JSON.parse(authData)?.state?.accessToken : null;
        } catch {
          return null;
        }
      })();

    if (token) {
      // Proactive client-side expiration check before making the request
      if (isTokenExpired(token)) {
        clearSession();
        if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
          window.location.href = '/login?expired=true';
        }
        return Promise.reject(new axios.Cancel('Session expired'));
      }

      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// ─────────────────────────────────────────────────────────────────────────────
// Response Interceptor: Intercept 401 and redirect to /login immediately
// ─────────────────────────────────────────────────────────────────────────────
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      const isLoginRequest = error.config?.url?.includes('/api/v1/auth/login');

      // Do not redirect on failed login attempts so the user sees the error message
      if (!isLoginRequest) {
        // Clear stored authentication data
        localStorage.removeItem('coop_access_token');
        localStorage.removeItem('coop_user');
        localStorage.removeItem('coop_auth_state');
        sessionStorage.clear();

        // Avoid redirect loops if already on login page
        if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
          // Redirect directly to login screen
          window.location.href = '/login?expired=true';
        }
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
