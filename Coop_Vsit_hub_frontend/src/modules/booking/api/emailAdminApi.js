import apiClient from '@/core/api/apiClient';

export const emailAdminApi = {
  getEmailLogs: async (params = {}) => {
    const response = await apiClient.get('/api/v1/email-logs', { params });
    return response.data;
  },
  getTemplates: async () => {
    const response = await apiClient.get('/api/v1/email-templates');
    return response.data;
  },
  saveTemplate: async (key, data) => {
    const response = await apiClient.put(`/api/v1/email-templates/${key}`, data);
    return response.data;
  },
  resetTemplate: async (key) => {
    const response = await apiClient.delete(`/api/v1/email-templates/${key}`);
    return response.data;
  },
};

export default emailAdminApi;
