import apiClient from '@/core/api/apiClient';

export const analyticsApi = {
  getDashboard: async () => {
    const response = await apiClient.get('/api/v1/analytics/dashboard');
    return response.data;
  },

  getFeedbackAnalytics: async () => {
    try {
      const response = await apiClient.get('/api/v1/feedback/analytics');
      return response.data;
    } catch (err) {
      console.warn('Feedback analytics endpoint optional fallback:', err);
      return null;
    }
  },
};

export default analyticsApi;
