import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import apiClient from '@/core/api/apiClient';

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      // NOTE: refreshToken is intentionally NOT stored here.
      // It lives in an HttpOnly cookie managed by the browser and server.
      isAuthenticated: false,
      isLoading: false,
      error: null,
      lockoutUntil: null,

      login: async (identifier, password, loginType = 'ACTIVE_DIRECTORY') => {
        set({ isLoading: true, error: null });
        try {
          const response = await apiClient.post('/api/v1/auth/login', {
            identifier: identifier.trim(),
            password,
            loginType,
          });

          // Only store accessToken and user — refreshToken is in HttpOnly cookie
          const { accessToken, user } = response.data;

          if (accessToken) {
            localStorage.setItem('coop_access_token', accessToken);
          }
          if (user) {
            localStorage.setItem('coop_user', JSON.stringify(user));
          }

          set({
            user,
            accessToken,
            isAuthenticated: true,
            isLoading: false,
            error: null,
            lockoutUntil: null,
          });

          return { success: true, user };
        } catch (err) {
          const errorMsg =
            err.response?.data?.message ||
            err.response?.data?.error ||
            'Authentication failed. Please check your credentials.';

          let lockoutTime = null;
          if (err.response?.status === 429) {
            lockoutTime = Date.now() + 15 * 60 * 1000; // 15 minutes lockout
          }

          set({
            isLoading: false,
            error: errorMsg,
            lockoutUntil: lockoutTime,
            isAuthenticated: false,
          });

          return {
            success: false,
            error: errorMsg,
            status: err.response?.status,
          };
        }
      },

      setAuthSession: ({ accessToken, user }) => {
        if (accessToken) {
          localStorage.setItem('coop_access_token', accessToken);
        }
        if (user) {
          localStorage.setItem('coop_user', JSON.stringify(user));
        }

        set((state) => ({
          accessToken: accessToken || state.accessToken,
          user: user || state.user,
          isAuthenticated: true,
        }));
      },

      fetchCurrentUser: async () => {
        try {
          const token = get().accessToken || localStorage.getItem('coop_access_token');
          if (!token) return null;
          const response = await apiClient.get('/api/v1/auth/me');
          if (response?.data) {
            localStorage.setItem('coop_user', JSON.stringify(response.data));
            set({ user: response.data, isAuthenticated: true });
            return response.data;
          }
        } catch (e) {
          console.warn('Failed to fetch current user profile:', e);
          return null;
        }
      },

      logout: async () => {
        try {
          const token = get().accessToken || localStorage.getItem('coop_access_token');
          if (token) {
            // Server will blacklist JWT and clear the HttpOnly cookie
            await apiClient.post('/api/v1/auth/logout', {});
          }
        } catch (e) {
          console.warn('Logout API failed gracefully:', e);
        } finally {
          set({
            user: null,
            accessToken: null,
            isAuthenticated: false,
            error: null,
            lockoutUntil: null,
          });
          localStorage.removeItem('coop_access_token');
          localStorage.removeItem('coop_user');
          localStorage.removeItem('coop_auth_state');
          sessionStorage.clear();
        }
      },

      hasRole: (roleName) => {
        const user = get().user;
        if (!user) return false;
        const targetClean = String(roleName).replace(/^ROLE_/, '').toUpperCase();

        const checkValue = (val) => {
          if (!val) return false;
          const clean = String(val).replace(/^ROLE_/, '').toUpperCase();
          return clean === targetClean || String(val) === String(roleName);
        };

        if (Array.isArray(user.roles)) {
          return user.roles.some((r) => {
            if (typeof r === 'string') return checkValue(r);
            if (typeof r === 'object' && r !== null) return checkValue(r.name || r.role || r.authority);
            return false;
          });
        }

        if (typeof user.role === 'string') return checkValue(user.role);
        return false;
      },

      hasAnyRole: (roleNames) => {
        const user = get().user;
        if (!user) return false;
        return roleNames.some((r) => get().hasRole(r));
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'coop_auth_state',
      // Explicitly whitelist only safe, non-sensitive fields for localStorage
      partialize: (state) => ({
        accessToken: state.accessToken,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        if (state?.accessToken) {
          localStorage.setItem('coop_access_token', state.accessToken);
        }
        if (state?.user) {
          localStorage.setItem('coop_user', JSON.stringify(state.user));
        }
      },
    }
  )
);

export default useAuthStore;
