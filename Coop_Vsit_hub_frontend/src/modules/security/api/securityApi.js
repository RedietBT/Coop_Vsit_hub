import apiClient from '@/core/api/apiClient';

export const securityApi = {
  getExpectedArrivals: async (params = {}) => {
    try {
      const [scheduledRes, approvedRes] = await Promise.all([
        apiClient.get('/api/v1/visits', {
          params: { status: 'SCHEDULED', size: 100, sortBy: 'scheduledStartTime', sortDirection: 'asc', ...params },
        }),
        apiClient.get('/api/v1/visits', {
          params: { status: 'APPROVED', size: 100, sortBy: 'scheduledStartTime', sortDirection: 'asc', ...params },
        }),
      ]);
      const scheduled = scheduledRes.data?.content || scheduledRes.data || [];
      const approved = approvedRes.data?.content || approvedRes.data || [];
      const combined = [...scheduled, ...approved];
      combined.sort((a, b) => new Date(a.scheduledStartTime || 0) - new Date(b.scheduledStartTime || 0));
      return combined;
    } catch (e) {
      console.warn('Failed to load expected arrivals:', e);
      return [];
    }
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
