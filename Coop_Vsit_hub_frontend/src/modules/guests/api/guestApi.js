import apiClient from '@/core/api/apiClient';

export const guestApi = {
  getAllGuests: async (params = {}) => {
    const response = await apiClient.get('/api/v1/guests', { params });
    return response.data;
  },

  getGuestById: async (id) => {
    const response = await apiClient.get(`/api/v1/guests/${id}`);
    return response.data;
  },

  getStats: async () => {
    const response = await apiClient.get('/api/v1/guests/stats');
    return response.data;
  },

  createGuest: async (payload) => {
    const response = await apiClient.post('/api/v1/guests', payload);
    return response.data;
  },

  updateGuest: async (id, payload) => {
    const response = await apiClient.put(`/api/v1/guests/${id}`, payload);
    return response.data;
  },

  deleteGuest: async (id) => {
    const response = await apiClient.delete(`/api/v1/guests/${id}`);
    return response.data;
  },
};

export default guestApi;
