import apiClient from '@/core/api/apiClient';

export const reportApi = {
  getSummary: async (params = {}) => {
    const response = await apiClient.get('/api/v1/reports/summary', { params });
    return response.data;
  },

  getDetailedReport: async (params = {}) => {
    const response = await apiClient.get('/api/v1/reports/detailed', { params });
    return response.data;
  },

  exportCsv: async (params = {}) => {
    const response = await apiClient.get('/api/v1/reports/export-csv', {
      params,
      responseType: 'blob',
    });
    const url = window.URL.createObjectURL(new Blob([response.data], { type: 'text/csv;charset=utf-8;' }));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `CoopBank_Visitor_Report_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  },

  exportPdf: async (params = {}) => {
    const response = await apiClient.get('/api/v1/reports/export-pdf', {
      params,
      responseType: 'blob',
    });
    const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `CoopBank_Visitor_Report_${Date.now()}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  },
};

export default reportApi;
