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

  getProfile: async () => {
    const response = await apiClient.get('/api/v1/auth/me');
    return response.data;
  },

  changePassword: async (payload) => {
    // payload: { currentPassword, newPassword, confirmNewPassword }
    const response = await apiClient.post('/api/v1/auth/change-password', payload);
    return response.data;
  },

  verifyEmail: async (token) => {
    const response = await apiClient.get('/api/v1/auth/verify-email', {
      params: { token },
    });
    return response.data;
  },

  forgotPassword: async (identifier) => {
    const response = await apiClient.post('/api/v1/auth/forgot-password', {
      identifier: identifier.trim(),
    });
    return response.data;
  },

  resetPassword: async (payload) => {
    const response = await apiClient.post('/api/v1/auth/reset-password', payload);
    return response.data;
  },
};

export default authApi;
