import { create } from 'zustand';
import { toast } from 'sonner';
import visitApi from '../api/visitApi';
import soundPlayer from '@/core/utils/soundPlayer';

export const useVisitStore = create((set, get) => ({
  visits: [],
  totalElements: 0,
  totalPages: 1,
  currentPage: 0,
  pageSize: 10,
  isLoading: false,
  error: null,

  filters: {
    search: '',
    status: '',
    priority: '',
    department: '',
    guestCategory: '',
  },

  selectedVisit: null,
  isDetailDrawerOpen: false,
  isCreateModalOpen: false,
  isStatusModalOpen: false,
  statusTransitionTarget: null, // { visit, action: 'APPROVE' | 'REJECT' | 'UNDER_REVIEW' }

  // Organization & Guest selector caches for modals
  organizations: [],
  individualGuests: [],

  setFilters: (newFilters) => {
    set((state) => ({
      filters: { ...state.filters, ...newFilters },
      currentPage: 0,
    }));
    get().fetchVisits();
  },

  resetFilters: () => {
    set({
      filters: {
        search: '',
        status: '',
        priority: '',
        department: '',
        guestCategory: '',
      },
      currentPage: 0,
    });
    get().fetchVisits();
  },

  setPage: (page) => {
    set({ currentPage: page });
    get().fetchVisits();
  },

  fetchFormLookups: async () => {
    try {
      const [orgs, guests] = await Promise.all([
        visitApi.getOrganizations(),
        visitApi.getIndividualGuests(),
      ]);
      set({ organizations: orgs, individualGuests: guests });
    } catch (e) {
      console.warn('Failed to load org/guest selectors:', e);
    }
  },

  openCreateModal: async () => {
    set({ isCreateModalOpen: true });
    get().fetchFormLookups();
  },

  closeCreateModal: () => set({ isCreateModalOpen: false }),

  openDetailDrawer: (visit) => set({ selectedVisit: visit, isDetailDrawerOpen: true }),
  closeDetailDrawer: () => set({ isDetailDrawerOpen: false, selectedVisit: null }),

  openStatusModal: (visit, action) =>
    set({
      isStatusModalOpen: true,
      statusTransitionTarget: { visit, action },
    }),

  closeStatusModal: () =>
    set({
      isStatusModalOpen: false,
      statusTransitionTarget: null,
    }),

  fetchVisits: async () => {
    set({ isLoading: true, error: null });
    try {
      const { filters, currentPage, pageSize } = get();
      const params = {
        page: currentPage,
        size: pageSize,
        ...(filters.search && { search: filters.search.trim() }),
        ...(filters.status && { status: filters.status }),
        ...(filters.priority && { priority: filters.priority }),
        ...(filters.department && { department: filters.department }),
        ...(filters.guestCategory && { guestCategory: filters.guestCategory }),
      };

      const data = await visitApi.getAllVisits(params);

      set({
        visits: data.content || data || [],
        totalElements: data.totalElements || (data.content || data || []).length,
        totalPages: data.totalPages || 1,
        isLoading: false,
      });
    } catch (err) {
      const errorMsg =
        err.response?.data?.message || 'Failed to fetch visits list.';
      set({ isLoading: false, error: errorMsg });
    }
  },

  fetchVisitById: async (id) => {
    try {
      const detail = await visitApi.getVisitById(id);
      set({ selectedVisit: detail });
      return detail;
    } catch (err) {
      console.error('Failed to load visit by ID:', err);
      return null;
    }
  },

  createVisit: async (payload) => {
    try {
      const newVisit = await visitApi.createVisit(payload);
      soundPlayer.playNotificationChime();
      toast.success(
        `Visit ${newVisit.visitCode || ''} created successfully (${newVisit.status}).`
      );
      get().closeCreateModal();
      get().fetchVisits();
      return { success: true, visit: newVisit };
    } catch (err) {
      const errorMsg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        'Failed to submit visit request.';
      toast.error(errorMsg);
      return { success: false, error: errorMsg };
    }
  },

  transitionStatus: async (visitId, targetStatus, approverComments) => {
    try {
      const updated = await visitApi.transitionStatus(visitId, {
        targetStatus,
        approverComments,
      });
      soundPlayer.playNotificationChime();
      toast.success(`Visit status updated to ${targetStatus}.`);
      get().closeStatusModal();
      if (get().selectedVisit?.id === visitId) {
        set({ selectedVisit: updated });
      }
      get().fetchVisits();
      return { success: true };
    } catch (err) {
      const errorMsg =
        err.response?.data?.message || 'Failed to transition visit status.';
      toast.error(errorMsg);
      return { success: false, error: errorMsg };
    }
  },

  checkIn: async (visitId, checkInData = {}) => {
    try {
      const updated = await visitApi.checkIn(visitId, checkInData);
      soundPlayer.playNotificationChime();
      toast.success(`Visitor checked in. Badge: ${updated.visitorBadgeNumber || 'Assigned'}`);
      if (get().selectedVisit?.id === visitId) {
        set({ selectedVisit: updated });
      }
      get().fetchVisits();
      return { success: true, visit: updated };
    } catch (err) {
      const errorMsg =
        err.response?.data?.message || 'Check-in failed.';
      toast.error(errorMsg);
      return { success: false, error: errorMsg };
    }
  },

  checkOut: async (visitId, checkOutData = {}) => {
    try {
      const updated = await visitApi.checkOut(visitId, checkOutData);
      soundPlayer.playNotificationChime();
      toast.success('Visitor checked out. Satisfaction survey invitation dispatched.');
      if (get().selectedVisit?.id === visitId) {
        set({ selectedVisit: updated });
      }
      get().fetchVisits();
      return { success: true, visit: updated };
    } catch (err) {
      const errorMsg =
        err.response?.data?.message || 'Check-out failed.';
      toast.error(errorMsg);
      return { success: false, error: errorMsg };
    }
  },

  deleteVisit: async (visitId) => {
    try {
      await visitApi.deleteVisit(visitId);
      toast.success('Visit request removed from system.');
      get().closeDetailDrawer();
      get().fetchVisits();
      return { success: true };
    } catch (err) {
      const errorMsg =
        err.response?.data?.message || 'Failed to delete visit.';
      toast.error(errorMsg);
      return { success: false, error: errorMsg };
    }
  },
}));

export default useVisitStore;
