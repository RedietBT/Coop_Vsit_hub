import apiClient from '@/core/api/apiClient';

export const auditApi = {
  getAuditLogs: async (params = {}) => {
    const response = await apiClient.get('/api/v1/audit-logs', { params });
    return response.data;
  },
};

export default auditApi;
