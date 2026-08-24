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
};

export default feedbackApi;
