import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL;

export const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: false,
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

// Request Interceptor: Attach Access Token
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

// Response Interceptor: Silent Token Refresh
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
        const authData = localStorage.getItem('coop_auth_state');
        let refreshToken = null;

        if (authData) {
          const parsed = JSON.parse(authData);
          refreshToken = parsed?.state?.refreshToken;
        }

        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        const response = await axios.post(`${BASE_URL}/api/v1/auth/refresh`, {
          refreshToken,
        });

        const { accessToken, refreshToken: newRefreshToken, user } = response.data;

        // Preserve existing user state if not returned by refresh endpoint
        let effectiveUser = user;
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
            refreshToken: newRefreshToken,
            user: effectiveUser,
            isAuthenticated: true,
          },
          version: 0,
        };
        localStorage.setItem('coop_auth_state', JSON.stringify(updatedState));

        // Dispatch window event to sync in-memory stores
        if (typeof window !== 'undefined') {
          window.dispatchEvent(
            new CustomEvent('coop_auth_refreshed', {
              detail: { accessToken, refreshToken: newRefreshToken, user: effectiveUser },
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
