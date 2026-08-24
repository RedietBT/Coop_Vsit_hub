import apiClient from '@/core/api/apiClient';

export const securityApi = {
  getExpectedArrivals: async (params = {}) => {
    const response = await apiClient.get('/api/v1/visits', {
      params: { status: 'APPROVED', size: 50, sortBy: 'scheduledStartTime', sortDirection: 'asc', ...params },
    });
    return response.data?.content || response.data || [];
  },

  getActiveOnSite: async (params = {}) => {
    const response = await apiClient.get('/api/v1/visits', {
      params: { status: 'IN_PROGRESS', size: 50, sortBy: 'actualCheckInTime', sortDirection: 'desc', ...params },
    });
    return response.data?.content || response.data || [];
  },

  getRecentDepartures: async (params = {}) => {
    const response = await apiClient.get('/api/v1/visits', {
      params: { status: 'COMPLETED', size: 20, sortBy: 'actualCheckOutTime', sortDirection: 'desc', ...params },
    });
    return response.data?.content || response.data || [];
  },

  checkInVisitor: async (visitId, payload = {}) => {
    const response = await apiClient.post(`/api/v1/visits/${visitId}/check-in`, payload);
    return response.data;
  },

  checkOutVisitor: async (visitId, payload = {}) => {
    const response = await apiClient.post(`/api/v1/visits/${visitId}/check-out`, payload);
    return response.data;
  },
};

export default securityApi;
