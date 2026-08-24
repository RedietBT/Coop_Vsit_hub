import { create } from 'zustand';
import auditApi from '../api/auditApi';

export const useAuditStore = create((set, get) => ({
  logs: [],
  totalElements: 0,
  totalPages: 0,
  currentPage: 0,
  pageSize: 15,
  isLoading: false,
  error: null,
  filters: {
    search: '',
    eventType: '',
  },

  setFilters: (newFilters) => {
    set((state) => ({
      filters: { ...state.filters, ...newFilters },
      currentPage: 0,
    }));
    get().fetchLogs();
  },

  resetFilters: () => {
    set({
      filters: { search: '', eventType: '' },
      currentPage: 0,
    });
    get().fetchLogs();
  },

  setPage: (page) => {
    set({ currentPage: page });
    get().fetchLogs();
  },

  fetchLogs: async () => {
    set({ isLoading: true, error: null });
    try {
      const { filters, currentPage, pageSize } = get();
      const params = {
        page: currentPage,
        size: pageSize,
        sortBy: 'createdAt',
        sortDirection: 'desc',
      };
      if (filters.search) params.search = filters.search;
      if (filters.eventType) params.eventType = filters.eventType;

      const data = await auditApi.getAuditLogs(params);
      set({
        logs: data.content || [],
        totalElements: data.totalElements || 0,
        totalPages: data.totalPages || 0,
        isLoading: false,
      });
    } catch (err) {
      set({
        isLoading: false,
        error: err.response?.data?.message || 'Failed to retrieve system audit logs.',
      });
    }
  },
}));

export default useAuditStore;
