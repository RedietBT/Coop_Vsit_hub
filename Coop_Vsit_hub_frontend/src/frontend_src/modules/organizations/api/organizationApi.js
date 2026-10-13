import apiClient from '@/core/api/apiClient';

export const organizationApi = {
  getAllOrganizations: async (params = {}) => {
    const response = await apiClient.get('/api/v1/organizations', { params });
    return response.data;
  },

  getOrganizationById: async (id) => {
    const response = await apiClient.get(`/api/v1/organizations/${id}`);
    return response.data;
  },

  getPortfolioStats: async () => {
    const response = await apiClient.get('/api/v1/organizations/stats');
    return response.data;
  },

  createOrganization: async (payload) => {
    const response = await apiClient.post('/api/v1/organizations', payload);
    return response.data;
  },

  updateOrganization: async (id, payload) => {
    const response = await apiClient.put(`/api/v1/organizations/${id}`, payload);
    return response.data;
  },

  deleteOrganization: async (id) => {
    const response = await apiClient.delete(`/api/v1/organizations/${id}`);
    return response.data;
  },
};

export default organizationApi;
