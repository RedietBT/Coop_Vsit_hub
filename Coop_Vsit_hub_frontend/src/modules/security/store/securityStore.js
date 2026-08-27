import { create } from 'zustand';
import { toast } from 'sonner';
import securityApi from '../api/securityApi';
import soundPlayer from '@/core/utils/soundPlayer';

export const useSecurityStore = create((set, get) => ({
  expectedArrivals: [],
  activeOnSite: [],
  recentDepartures: [],
  isLoading: false,
  error: null,
  activeTab: 'arrivals', // 'arrivals' | 'onsite' | 'departures'
  searchQuery: '',

  checkInTarget: null,
  isCheckInModalOpen: false,

  checkOutTarget: null,
  isCheckOutModalOpen: false,

  editVisitorTarget: null,
  isEditVisitorModalOpen: false,

  setActiveTab: (tab) => set({ activeTab: tab }),
  setSearchQuery: (query) => set({ searchQuery: query }),

  openCheckInModal: (visit) => set({ checkInTarget: visit, isCheckInModalOpen: true }),
  closeCheckInModal: () => set({ checkInTarget: null, isCheckInModalOpen: false }),

  openCheckOutModal: (visit) => set({ checkOutTarget: visit, isCheckOutModalOpen: true }),
  closeCheckOutModal: () => set({ checkOutTarget: null, isCheckOutModalOpen: false }),

  openEditVisitorModal: (visit) => set({ editVisitorTarget: visit, isEditVisitorModalOpen: true }),
  closeEditVisitorModal: () => set({ editVisitorTarget: null, isEditVisitorModalOpen: false }),

  fetchSecurityFeed: async (isManual = false) => {
    set({ isLoading: true, error: null });
    try {
      const [arrivals, onSite, departures] = await Promise.all([
        securityApi.getExpectedArrivals(),
        securityApi.getActiveOnSite(),
        securityApi.getRecentDepartures(),
      ]);

      set({
        expectedArrivals: arrivals,
        activeOnSite: onSite,
        recentDepartures: departures,
        isLoading: false,
      });

      if (isManual) {
        toast.success('Front desk arrival feed updated.');
      }
    } catch (err) {
      const errorMsg =
        err.response?.data?.message || 'Failed to load front desk security data.';
      set({ isLoading: false, error: errorMsg });
      if (isManual) toast.error(errorMsg);
    }
  },

  submitCheckIn: async (visitId, checkInData) => {
    try {
      const updated = await securityApi.checkInVisitor(visitId, checkInData);
      soundPlayer.playNotificationChime();
      toast.success(
        `Visitor checked in. Assigned Security Badge: ${updated.visitorBadgeNumber || 'COOPV-ACTIVE'}`
      );
      get().closeCheckInModal();
      get().fetchSecurityFeed();
      // Switch tab to on-site so security officer immediately sees the active badge
      set({ activeTab: 'onsite' });
      return { success: true, visit: updated };
    } catch (err) {
      const errorMsg =
        err.response?.data?.message || 'Check-in validation failed.';
      toast.error(errorMsg);
      return { success: false, error: errorMsg };
    }
  },

  submitCheckOut: async (visitId, checkOutData) => {
    try {
      const updated = await securityApi.checkOutVisitor(visitId, checkOutData);
      soundPlayer.playNotificationChime();
      toast.success(
        'Visitor checked out. Badge returned & satisfaction survey dispatched.'
      );
      get().closeCheckOutModal();
      get().fetchSecurityFeed();
      return { success: true, visit: updated };
    } catch (err) {
      const errorMsg =
        err.response?.data?.message || 'Check-out failed.';
      toast.error(errorMsg);
      return { success: false, error: errorMsg };
    }
  },
}));

export default useSecurityStore;
