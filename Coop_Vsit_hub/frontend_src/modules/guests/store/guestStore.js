import { create } from 'zustand';
import { toast } from 'sonner';
import guestApi from '../api/guestApi';
import soundPlayer from '@/core/utils/soundPlayer';

export const useGuestStore = create((set, get) => ({
  guests: [],
  totalElements: 0,
  totalPages: 1,
  currentPage: 0,
  pageSize: 10,
  guestStats: null,
  isLoading: false,
  error: null,

  filters: {
    search: '',
    vipTier: '',
    country: '',
  },

  selectedGuest: null,
  isCreateModalOpen: false,
  isProfileDrawerOpen: false,

  editTarget: null,
  isEditModalOpen: false,

  setFilters: (newFilters) => {
    set((state) => ({
      filters: { ...state.filters, ...newFilters },
      currentPage: 0,
    }));
    get().fetchGuests();
  },

  resetFilters: () => {
    set({
      filters: { search: '', vipTier: '', country: '' },
      currentPage: 0,
    });
    get().fetchGuests();
  },

  setPage: (page) => {
    set({ currentPage: page });
    get().fetchGuests();
  },

  openCreateModal: () => set({ isCreateModalOpen: true }),
  closeCreateModal: () => set({ isCreateModalOpen: false }),

  openEditModal: (guest) => set({ editTarget: guest, isEditModalOpen: true }),
  closeEditModal: () => set({ editTarget: null, isEditModalOpen: false }),

  openProfileDrawer: (guest) => set({ selectedGuest: guest, isProfileDrawerOpen: true }),
  closeProfileDrawer: () => set({ selectedGuest: null, isProfileDrawerOpen: false }),

  fetchGuests: async () => {
    set({ isLoading: true, error: null });
    try {
      const { filters, currentPage, pageSize } = get();
      const params = {
        page: currentPage,
        size: pageSize,
        ...(filters.search && { search: filters.search.trim() }),
        ...(filters.vipTier && { vipTier: filters.vipTier }),
        ...(filters.country && { country: filters.country }),
      };

      const data = await guestApi.getAllGuests(params);

      set({
        guests: data.content || data || [],
        totalElements: data.totalElements || (data.content || data || []).length,
        totalPages: data.totalPages || 1,
        isLoading: false,
      });
    } catch (err) {
      const errorMsg =
        err.response?.data?.message || 'Failed to fetch individual guests directory.';
      set({ isLoading: false, error: errorMsg });
    }
  },

  fetchStats: async () => {
    try {
      const stats = await guestApi.getStats();
      set({ guestStats: stats });
    } catch (e) {
      console.warn('Failed to load guest stats:', e);
    }
  },

  createGuest: async (payload) => {
    try {
      const newGuest = await guestApi.createGuest(payload);
      soundPlayer.playNotificationChime();
      toast.success(`Guest "${newGuest.fullName}" registered successfully.`);
      get().closeCreateModal();
      get().fetchGuests();
      get().fetchStats();
      return { success: true, guest: newGuest };
    } catch (err) {
      const errorMsg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        'Failed to register guest.';
      toast.error(errorMsg);
      return { success: false, error: errorMsg };
    }
  },

  updateGuest: async (id, payload) => {
    try {
      const updated = await guestApi.updateGuest(id, payload);
      soundPlayer.playNotificationChime();
      toast.success(`Guest "${updated.fullName}" updated successfully.`);
      get().closeEditModal();
      get().fetchGuests();
      get().fetchStats();
      if (get().selectedGuest?.id === id) {
        set({ selectedGuest: updated });
      }
      return { success: true, guest: updated };
    } catch (err) {
      const errorMsg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        'Failed to update guest.';
      toast.error(errorMsg);
      return { success: false, error: errorMsg };
    }
  },

  deleteGuest: async (id, name) => {
    try {
      await guestApi.deleteGuest(id);
      toast.success(`Guest "${name}" removed.`);
      get().fetchGuests();
      get().fetchStats();
      get().closeProfileDrawer();
    } catch (err) {
      toast.error(
        err.response?.data?.message || 'Failed to delete guest (visit history exists).'
      );
    }
  },
}));

export default useGuestStore;
