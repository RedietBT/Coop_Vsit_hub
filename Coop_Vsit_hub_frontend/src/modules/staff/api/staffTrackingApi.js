import apiClient from '@/core/api/apiClient';

export const staffTrackingApi = {
  getOverview: async () => {
    const response = await apiClient.get('/api/v1/staff/overview');
    return response.data?.data || response.data;
  },

  getMyVisits: async () => {
    const response = await apiClient.get('/api/v1/staff/my-visits');
    return response.data?.data || response.data || [];
  },

  getMyOrganizations: async () => {
    const response = await apiClient.get('/api/v1/staff/my-organizations');
    return response.data?.data || response.data || [];
  },

  getMyGuests: async () => {
    const response = await apiClient.get('/api/v1/staff/my-guests');
    return response.data?.data || response.data || [];
  },

  linkBooking: async (bookingId, visitId) => {
    const response = await apiClient.post('/api/v1/staff/link-booking', { bookingId, visitId });
    return response.data?.data || response.data;
  },
};

export default staffTrackingApi;
