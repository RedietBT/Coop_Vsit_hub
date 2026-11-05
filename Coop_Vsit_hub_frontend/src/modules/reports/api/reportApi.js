import apiClient from '@/core/api/apiClient';

const handleBlobDownload = async (response, defaultFilename, defaultType) => {
  // If the server returned an error JSON inside the blob
  if (response.data && response.data.type === 'application/json') {
    const text = await response.data.text();
    try {
      const json = JSON.parse(text);
      throw new Error(json.message || 'Export failed.');
    } catch (e) {
      if (e.message) throw e;
    }
  }

  const blob = new Blob([response.data], { type: defaultType });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', defaultFilename);
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => window.URL.revokeObjectURL(url), 1000);
};

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
    await handleBlobDownload(
      response,
      `CoopBank_Visitor_Report_${Date.now()}.csv`,
      'text/csv;charset=utf-8;'
    );
  },

  exportExcel: async (params = {}) => {
    const response = await apiClient.get('/api/v1/reports/export-excel', {
      params,
      responseType: 'blob',
    });
    await handleBlobDownload(
      response,
      `CoopBank_Visitor_Report_${Date.now()}.xls`,
      'application/vnd.ms-excel;charset=utf-8;'
    );
  },

  exportPdf: async (params = {}) => {
    const response = await apiClient.get('/api/v1/reports/export-pdf', {
      params,
      responseType: 'blob',
    });
    await handleBlobDownload(
      response,
      `CoopBank_Visitor_Report_${Date.now()}.pdf`,
      'application/pdf'
    );
  },
};

export default reportApi;
