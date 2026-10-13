import apiClient from '@/core/api/apiClient';

export const userApi = {
  getAllUsers: async (params = {}) => {
    const response = await apiClient.get('/api/v1/users', { params });
    return response.data;
  },

  getUserById: async (id) => {
    const response = await apiClient.get(`/api/v1/users/${id}`);
    return response.data;
  },

  getUserStats: async () => {
    const response = await apiClient.get('/api/v1/users/stats');
    return response.data;
  },

  getAllRoles: async () => {
    const response = await apiClient.get('/api/v1/users/roles');
    return response.data;
  },

  onboardUser: async (payload) => {
    // payload: { username, email, password, confirmPassword, firstName, lastName, phone, department, jobTitle, roleNames }
    const response = await apiClient.post('/api/v1/auth/register', payload);
    return response.data;
  },

  updateUser: async (id, payload) => {
    const response = await apiClient.put(`/api/v1/users/${id}`, payload);
    return response.data;
  },

  updateUserRoles: async (id, payload) => {
    // payload: { roleNames: string[] }
    const response = await apiClient.put(`/api/v1/users/${id}/roles`, payload);
    return response.data;
  },

  updateUserStatus: async (id, payload) => {
    // payload: { isEnabled: boolean, isAccountNonLocked: boolean }
    const response = await apiClient.patch(`/api/v1/users/${id}/status`, payload);
    return response.data;
  },

  deleteUser: async (id) => {
    const response = await apiClient.delete(`/api/v1/users/${id}`);
    return response.data;
  },
};

export default userApi;
