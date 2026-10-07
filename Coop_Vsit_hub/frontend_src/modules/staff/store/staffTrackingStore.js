import { create } from 'zustand';
import staffTrackingApi from '../api/staffTrackingApi';
import { toast } from 'sonner';

export const useStaffTrackingStore = create((set, get) => ({
  overview: null,
  trackedVisits: [],
  trackedOrganizations: [],
  trackedGuests: [],
  isLoading: false,
  error: null,

  fetchOverview: async () => {
    set({ isLoading: true, error: null });
    try {
      const data = await staffTrackingApi.getOverview();
      set({
        overview: data,
        trackedVisits: data?.visits || [],
        trackedOrganizations: data?.organizations || [],
        trackedGuests: data?.individualGuests || [],
        isLoading: false,
      });
    } catch (err) {
      console.warn('Failed to load staff tracking overview:', err);
      set({ error: err.message, isLoading: false });
    }
  },

  fetchMyVisits: async () => {
    set({ isLoading: true });
    try {
      const visits = await staffTrackingApi.getMyVisits();
      set({ trackedVisits: visits, isLoading: false });
    } catch (err) {
      set({ error: err.message, isLoading: false });
    }
  },

  fetchMyOrganizations: async () => {
    set({ isLoading: true });
    try {
      const orgs = await staffTrackingApi.getMyOrganizations();
      set({ trackedOrganizations: orgs, isLoading: false });
    } catch (err) {
      set({ error: err.message, isLoading: false });
    }
  },

  fetchMyGuests: async () => {
    set({ isLoading: true });
    try {
      const guests = await staffTrackingApi.getMyGuests();
      set({ trackedGuests: guests, isLoading: false });
    } catch (err) {
      set({ error: err.message, isLoading: false });
    }
  },

  linkBooking: async (bookingId, visitId) => {
    try {
      await staffTrackingApi.linkBooking(bookingId, visitId);
      toast.success('Room booking successfully linked to visit');
      get().fetchOverview();
    } catch (err) {
      toast.error('Failed to link booking: ' + (err.response?.data?.message || err.message));
    }
  },
}));

export default useStaffTrackingStore;
