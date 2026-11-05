import { create } from 'zustand';
import { toast } from 'sonner';
import reportApi from '../api/reportApi';

export const useReportStore = create((set, get) => ({
  summary: null,
  reportItems: [],
  page: 0,
  size: 10,
  totalPages: 1,
  totalElements: 0,
  isLoading: false,
  isExporting: false,
  error: null,

  // Filters
  startDate: '',
  endDate: '',
  department: '',
  engagementType: 'ALL',
  activeTab: 'detailed', // 'detailed' | 'rooms' | 'financials'

  setFilters: (filters) => set({ ...filters, page: 0 }),
  setActiveTab: (tab) => set({ activeTab: tab }),
  setPage: (page) => {
    set({ page });
    get().fetchDetailedReport();
  },

  buildParams: (override = {}) => {
    const { startDate, endDate, department, engagementType } = { ...get(), ...override };
    const params = {};
    if (startDate) {
      params.startDate = new Date(startDate.includes('T') ? startDate : startDate + 'T00:00:00').toISOString();
    }
    if (endDate) {
      params.endDate = new Date(endDate.includes('T') ? endDate : endDate + 'T23:59:59').toISOString();
    }
    if (department && department !== 'All Departments') {
      params.department = department;
    }
    if (engagementType && engagementType !== 'ALL') {
      params.engagementType = engagementType;
    }
    return params;
  },

  fetchReportData: async (overrideFilters = {}) => {
    set({ isLoading: true, error: null });
    const { page, size } = get();
    const params = {
      page,
      size,
      ...get().buildParams(overrideFilters),
    };

    try {
      const [summaryData, tableData] = await Promise.all([
        reportApi.getSummary(params),
        reportApi.getDetailedReport(params),
      ]);

      set({
        summary: summaryData,
        reportItems: tableData.content || [],
        totalPages: tableData.totalPages || 1,
        totalElements: tableData.totalElements || 0,
        isLoading: false,
      });
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to fetch report data.';
      set({ error: msg, isLoading: false });
      toast.error(msg);
    }
  },

  fetchDetailedReport: async (overrideFilters = {}) => {
    const { page, size } = get();
    const params = {
      page,
      size,
      ...get().buildParams(overrideFilters),
    };

    try {
      const tableData = await reportApi.getDetailedReport(params);
      set({
        reportItems: tableData.content || [],
        totalPages: tableData.totalPages || 1,
        totalElements: tableData.totalElements || 0,
      });
    } catch (err) {
      toast.error('Failed to load visitor report page.');
    }
  },

  exportCsv: async (overrideFilters = {}) => {
    const params = get().buildParams(overrideFilters);

    set({ isExporting: true });
    try {
      await reportApi.exportCsv(params);
      toast.success('CSV Report downloaded successfully!');
    } catch (err) {
      const msg = err.message || err.response?.data?.message || 'Failed to export CSV report.';
      toast.error(msg);
    } finally {
      set({ isExporting: false });
    }
  },

  exportExcel: async (overrideFilters = {}) => {
    const params = get().buildParams(overrideFilters);

    set({ isExporting: true });
    try {
      await reportApi.exportExcel(params);
      toast.success('Excel Spreadsheet downloaded successfully!');
    } catch (err) {
      const msg = err.message || err.response?.data?.message || 'Failed to export Excel report.';
      toast.error(msg);
    } finally {
      set({ isExporting: false });
    }
  },

  exportPdf: async (overrideFilters = {}) => {
    const params = get().buildParams(overrideFilters);

    set({ isExporting: true });
    try {
      await reportApi.exportPdf(params);
      toast.success('Executive PDF Report downloaded successfully!');
    } catch (err) {
      const msg = err.message || err.response?.data?.message || 'Failed to export PDF report.';
      toast.error(msg);
    } finally {
      set({ isExporting: false });
    }
  },
}));

export default useReportStore;
