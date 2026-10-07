import { create } from 'zustand';
import staffTrackingApi from '../api/staffTrackingApi';
import { toast } from 'sonner';

export const useStaffTrackingStore = create((set, get) => ({
  overview: null,
  trackedVisits: [],
  trackedBookings: [],
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
        trackedBookings: data?.roomBookings || [],
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

  fetchMyBookings: async () => {
    set({ isLoading: true });
    try {
      const bookings = await staffTrackingApi.getMyBookings();
      set({ trackedBookings: bookings, isLoading: false });
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

  cancelBooking: async (bookingId) => {
    try {
      await staffTrackingApi.cancelBooking(bookingId);
      toast.success('Room reservation cancelled successfully');
      await get().fetchOverview();
      return true;
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to cancel reservation';
      toast.error(msg);
      throw err;
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
