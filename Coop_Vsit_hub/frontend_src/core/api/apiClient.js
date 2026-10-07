import axios from 'axios';

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
// ─────────────────────────────────────────────────────────────────────────────
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Avoid infinite loops on auth endpoints
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url.includes('/api/v1/auth/login') &&
      !originalRequest.url.includes('/api/v1/auth/refresh')
    ) {
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

        // Update localStorage — no refreshToken stored here anymore
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
        localStorage.removeItem('coop_auth_state');
        if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
          window.location.href = '/login?expired=true';
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
