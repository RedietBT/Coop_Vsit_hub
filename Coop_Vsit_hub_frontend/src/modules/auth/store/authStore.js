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
        if (!user || !user.roles) return false;
        return user.roles.includes(roleName);
      },

      hasAnyRole: (roleNames) => {
        const user = get().user;
        if (!user || !user.roles) return false;
        return roleNames.some((role) => user.roles.includes(role));
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'coop_auth_state',
    }
  )
);

export default useAuthStore;
