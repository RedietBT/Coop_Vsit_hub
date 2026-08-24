import apiClient from '@/core/api/apiClient';

export const authApi = {
  login: async (credentials) => {
    const response = await apiClient.post('/api/v1/auth/login', credentials);
    return response.data;
  },

  logout: async () => {
    const response = await apiClient.post('/api/v1/auth/logout', {});
    return response.data;
  },

  refreshToken: async (refreshToken) => {
    const response = await apiClient.post('/api/v1/auth/refresh', { refreshToken });
    return response.data;
  },

  verifyEmail: async (token) => {
    const response = await apiClient.get(`/api/v1/auth/verify-email/${token}`);
    return response.data;
  },

  forgotPassword: async (email) => {
    const response = await apiClient.post('/api/v1/auth/forgot-password', { email });
    return response.data;
  },

  resetPassword: async (payload) => {
    const response = await apiClient.post('/api/v1/auth/reset-password', payload);
    return response.data;
  },
};

export default authApi;
