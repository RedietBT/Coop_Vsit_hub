import apiClient from '@/core/api/apiClient';

export const feedbackApi = {
  verifyToken: async (token) => {
    const response = await apiClient.get(`/api/v1/feedback/verify/${token}`);
    return response.data;
  },

  submitFeedback: async (payload) => {
    const response = await apiClient.post('/api/v1/feedback/submit', payload);
    return response.data;
  },

  getFeedbackAnalytics: async () => {
    const response = await apiClient.get('/api/v1/feedback/analytics');
    return response.data;
  },

  getFeedbackByVisitId: async (visitId) => {
    const response = await apiClient.get(`/api/v1/feedback/visit/${visitId}`);
    return response.data;
  },

  togglePin: async (feedbackId) => {
    const response = await apiClient.put(`/api/v1/feedback/${feedbackId}/pin`);
    return response.data;
  },

  getPinnedFeedbacks: async () => {
    const response = await apiClient.get('/api/v1/feedback/pinned');
    return response.data;
  },

  getGuestFeedbacks: async (guestId) => {
    const response = await apiClient.get(`/api/v1/feedback/guest/${guestId}`);
    return response.data;
  },

  getOrgFeedbacks: async (orgId) => {
    const response = await apiClient.get(`/api/v1/feedback/organization/${orgId}`);
    return response.data;
  },
};

export default feedbackApi;
