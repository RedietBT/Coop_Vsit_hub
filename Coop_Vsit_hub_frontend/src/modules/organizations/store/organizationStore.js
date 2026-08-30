import { create } from 'zustand';
import { toast } from 'sonner';
import organizationApi from '../api/organizationApi';
import soundPlayer from '@/core/utils/soundPlayer';

export const useOrganizationStore = create((set, get) => ({
  organizations: [],
  totalElements: 0,
  totalPages: 1,
  currentPage: 0,
  pageSize: 10,
  portfolioStats: null,
  isLoading: false,
  error: null,

  filters: {
    search: '',
    category: '',
    industrySector: '',
  },

  selectedOrg: null,
  editingOrg: null,
  isCreateModalOpen: false,
  isEditModalOpen: false,
  isProfileDrawerOpen: false,

  setFilters: (newFilters) => {
    set((state) => ({
      filters: { ...state.filters, ...newFilters },
      currentPage: 0,
    }));
    get().fetchOrganizations();
  },

  resetFilters: () => {
    set({
      filters: { search: '', category: '', industrySector: '' },
      currentPage: 0,
    });
    get().fetchOrganizations();
  },

  setPage: (page) => {
    set({ currentPage: page });
    get().fetchOrganizations();
  },

  openCreateModal: () => set({ isCreateModalOpen: true }),
  closeCreateModal: () => set({ isCreateModalOpen: false }),

  openEditModal: (org) => set({ editingOrg: org, isEditModalOpen: true }),
  closeEditModal: () => set({ editingOrg: null, isEditModalOpen: false }),

  openProfileDrawer: (org) => set({ selectedOrg: org, isProfileDrawerOpen: true }),
  closeProfileDrawer: () => set({ selectedOrg: null, isProfileDrawerOpen: false }),

  fetchOrganizations: async () => {
    set({ isLoading: true, error: null });
    try {
      const { filters, currentPage, pageSize } = get();
      const params = {
        page: currentPage,
        size: pageSize,
        ...(filters.search && { search: filters.search.trim() }),
        ...(filters.category && { category: filters.category }),
        ...(filters.industrySector && { industrySector: filters.industrySector }),
      };

      const data = await organizationApi.getAllOrganizations(params);

      set({
        organizations: data.content || data || [],
        totalElements: data.totalElements || (data.content || data || []).length,
        totalPages: data.totalPages || 1,
        isLoading: false,
      });
    } catch (err) {
      const errorMsg =
        err.response?.data?.message || 'Failed to fetch organizations directory.';
      set({ isLoading: false, error: errorMsg });
    }
  },

  fetchStats: async () => {
    try {
      const stats = await organizationApi.getPortfolioStats();
      set({ portfolioStats: stats });
    } catch (e) {
      console.warn('Failed to load portfolio stats:', e);
    }
  },

  createOrganization: async (payload) => {
    try {
      const newOrg = await organizationApi.createOrganization(payload);
      soundPlayer.playNotificationChime();
      toast.success(`Partner organization "${newOrg.name}" registered successfully.`);
      get().closeCreateModal();
      get().fetchOrganizations();
      get().fetchStats();
      return { success: true, organization: newOrg };
    } catch (err) {
      const errorMsg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        'Failed to register organization.';
      toast.error(errorMsg);
      return { success: false, error: errorMsg };
    }
  },

  updateOrganization: async (id, payload) => {
    try {
      const updated = await organizationApi.updateOrganization(id, payload);
      toast.success(`Organization "${updated.name}" updated successfully.`);
      get().closeEditModal();
      // If drawer is viewing this org, update drawer state too
      if (get().selectedOrg?.id === id) {
        set({ selectedOrg: updated });
      }
      get().fetchOrganizations();
      get().fetchStats();
      return { success: true, organization: updated };
    } catch (err) {
      const errorMsg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        'Failed to update organization.';
      toast.error(errorMsg);
      return { success: false, error: errorMsg };
    }
  },

  deleteOrganization: async (id, name) => {
    try {
      await organizationApi.deleteOrganization(id);
      toast.success(`Organization "${name}" removed from register.`);
      get().fetchOrganizations();
      get().fetchStats();
      get().closeProfileDrawer();
    } catch (err) {
      toast.error(
        err.response?.data?.message ||
          'Failed to delete organization (active visit history may exist).'
      );
    }
  },
}));

export default useOrganizationStore;
