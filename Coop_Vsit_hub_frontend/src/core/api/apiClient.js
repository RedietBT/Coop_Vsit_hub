import axios from 'axios';
import { triggerSessionLogout, recordUserActivity } from '@/core/auth/sessionManager';

const BASE_URL = import.meta.env.VITE_API_URL;

export const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  // Required so the browser sends the HttpOnly refresh-token cookie automatically
  withCredentials: true,
});

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// ─────────────────────────────────────────────────────────────────────────────
// Request Interceptor: Attach Access Token from Zustand / localStorage
// ─────────────────────────────────────────────────────────────────────────────
apiClient.interceptors.request.use(
  (config) => {
    // Record user activity on API requests
    recordUserActivity();

    const authData = localStorage.getItem('coop_auth_state');
    if (authData) {
      try {
        const parsed = JSON.parse(authData);
        if (parsed?.state?.accessToken) {
          config.headers.Authorization = `Bearer ${parsed.state.accessToken}`;
        }
      } catch (e) {
        console.error('Failed to parse auth state from localStorage', e);
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ─────────────────────────────────────────────────────────────────────────────
// Response Interceptor: Silent Token Refresh via HttpOnly Cookie
// When the access token expires (401), the browser automatically sends the
// HttpOnly refresh cookie — no JavaScript needs to handle it.
// If refresh fails or session has passed, force full logout.
// ─────────────────────────────────────────────────────────────────────────────
apiClient.interceptors.response.use(
  (response) => {
    recordUserActivity();
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // If 401 on login endpoint, let the login form handle the invalid credentials error
    if (error.response?.status === 401 && originalRequest?.url?.includes('/api/v1/auth/login')) {
      return Promise.reject(error);
    }

    // If 401 on refresh endpoint or request already retried, session has passed!
    if (
      error.response?.status === 401 &&
      (originalRequest?._retry || originalRequest?.url?.includes('/api/v1/auth/refresh'))
    ) {
      processQueue(error, null);
      triggerSessionLogout('expired');
      return Promise.reject(error);
    }

    // Attempt silent token refresh for standard expired 401s
    if (error.response?.status === 401 && !originalRequest?._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return apiClient(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // POST /refresh with empty body — browser sends HttpOnly cookie automatically
        const response = await axios.post(
          `${BASE_URL}/api/v1/auth/refresh`,
          {},
          { withCredentials: true }
        );

        const { accessToken, user } = response.data;

        // Preserve existing user state if profile not in refresh response
        let effectiveUser = user;
        const authData = localStorage.getItem('coop_auth_state');
        if (!effectiveUser && authData) {
          try {
            const parsed = JSON.parse(authData);
            effectiveUser = parsed?.state?.user;
          } catch (_) {}
        }

        // Update localStorage
        const updatedState = {
          state: {
            accessToken,
            user: effectiveUser,
            isAuthenticated: true,
          },
          version: 0,
        };
        localStorage.setItem('coop_auth_state', JSON.stringify(updatedState));

        // Sync in-memory Zustand store
        if (typeof window !== 'undefined') {
          window.dispatchEvent(
            new CustomEvent('coop_auth_refreshed', {
              detail: { accessToken, user: effectiveUser },
            })
          );
        }

        apiClient.defaults.headers.common.Authorization = `Bearer ${accessToken}`;
        processQueue(null, accessToken);

        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        triggerSessionLogout('expired');
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
