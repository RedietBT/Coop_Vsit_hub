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

      // Front Desk expected arrivals should focus on visitor delegations
      const visitorArrivals = combined.filter((v) => {
        // Include if explicitly external or has an affiliated organization
        if (v.visitType === 'EXTERNAL' || v.guestCategory === 'ORGANIZATION') return true;
        // Include if visitor demographics were registered (phone, id number, visitor names)
        if (v.individualGuestPhone || v.visitorPhone || v.visitorIdNumber || v.individualGuestIdNumber) return true;
        // If it's titled "Room Reservation - " and has no visitor demographics, keep it as internal room booking
        if (v.title?.startsWith('Room Reservation - ')) return false;
        return true;
      });

      return visitorArrivals;
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
