import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import apiClient from '@/core/api/apiClient';

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
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

          const { accessToken, refreshToken, user } = response.data;

          set({
            user,
            accessToken,
            refreshToken,
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

          // Check if status is 429 (Locked)
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

      setAuthSession: ({ accessToken, refreshToken, user }) => {
        set((state) => ({
          accessToken: accessToken || state.accessToken,
          refreshToken: refreshToken || state.refreshToken,
          user: user || state.user,
          isAuthenticated: true,
        }));
      },

      fetchCurrentUser: async () => {
        try {
          const token = get().accessToken;
          if (!token) return null;
          const response = await apiClient.get('/api/v1/auth/me');
          if (response?.data) {
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
          const token = get().accessToken;
          if (token) {
            await apiClient.post('/api/v1/auth/logout', {});
          }
        } catch (e) {
          console.warn('Logout API failed gracefully:', e);
        } finally {
          set({
            user: null,
            accessToken: null,
            refreshToken: null,
            isAuthenticated: false,
            error: null,
            lockoutUntil: null,
          });
          localStorage.removeItem('coop_auth_state');
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
    }
  )
);

export default useAuthStore;
