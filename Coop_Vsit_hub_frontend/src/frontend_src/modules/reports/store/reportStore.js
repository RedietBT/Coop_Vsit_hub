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
  activeTab: 'detailed', // 'detailed' | 'departments' | 'financials'

  setFilters: (filters) => set({ ...filters, page: 0 }),
  setActiveTab: (tab) => set({ activeTab: tab }),
  setPage: (page) => {
    set({ page });
    get().fetchDetailedReport();
  },

  fetchReportData: async () => {
    set({ isLoading: true, error: null });
    const { startDate, endDate, department, page, size } = get();
    const params = {
      page,
      size,
    };
    if (startDate) params.startDate = new Date(startDate).toISOString();
    if (endDate) params.endDate = new Date(endDate + 'T23:59:59').toISOString();
    if (department && department !== 'All Departments') params.department = department;

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

  fetchDetailedReport: async () => {
    const { startDate, endDate, department, page, size } = get();
    const params = { page, size };
    if (startDate) params.startDate = new Date(startDate).toISOString();
    if (endDate) params.endDate = new Date(endDate + 'T23:59:59').toISOString();
    if (department && department !== 'All Departments') params.department = department;

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

  exportCsv: async () => {
    const { startDate, endDate, department } = get();
    const params = {};
    if (startDate) params.startDate = new Date(startDate).toISOString();
    if (endDate) params.endDate = new Date(endDate + 'T23:59:59').toISOString();
    if (department && department !== 'All Departments') params.department = department;

    set({ isExporting: true });
    try {
      await reportApi.exportCsv(params);
      toast.success('CSV Report downloaded successfully!');
    } catch (err) {
      toast.error('Failed to export CSV report.');
    } finally {
      set({ isExporting: false });
    }
  },

  exportPdf: async () => {
    const { startDate, endDate, department } = get();
    const params = {};
    if (startDate) params.startDate = new Date(startDate).toISOString();
    if (endDate) params.endDate = new Date(endDate + 'T23:59:59').toISOString();
    if (department && department !== 'All Departments') params.department = department;

    set({ isExporting: true });
    try {
      await reportApi.exportPdf(params);
      toast.success('Executive PDF Report downloaded successfully!');
    } catch (err) {
      toast.error('Failed to export PDF report.');
    } finally {
      set({ isExporting: false });
    }
  },
}));

export default useReportStore;
