import { create } from 'zustand';
import { toast } from 'sonner';
import analyticsApi from '../api/analyticsApi';

export const useAnalyticsStore = create((set, get) => ({
  dashboardData: null,
  feedbackData: null,
  isLoading: false,
  error: null,
  lastRefreshedAt: null,
  showFinancials: localStorage.getItem('coop_show_financials') === 'true',
  pinnedFeedbackIds: JSON.parse(localStorage.getItem('coop_pinned_feedback') || '[]'),

  fetchDashboard: async (isManualRefresh = false) => {
    set({ isLoading: true, error: null });
    try {
      const [dashRes, feedbackRes] = await Promise.all([
        analyticsApi.getDashboard(),
        analyticsApi.getFeedbackAnalytics(),
      ]);

      set({
        dashboardData: dashRes,
        feedbackData: feedbackRes,
        isLoading: false,
        lastRefreshedAt: new Date().toISOString(),
      });

      if (isManualRefresh) {
        toast.success('Executive analytics data refreshed.');
      }
    } catch (err) {
      const errorMsg =
        err.response?.data?.message || 'Failed to load analytics dashboard data.';
      set({ isLoading: false, error: errorMsg });
      if (isManualRefresh) {
        toast.error(errorMsg);
      }
    }
  },

  toggleShowFinancials: () => {
    const nextState = !get().showFinancials;
    localStorage.setItem('coop_show_financials', String(nextState));
    set({ showFinancials: nextState });
    if (nextState) {
      toast.info('Financial Deal Pipeline figures visible.');
    } else {
      toast.info('Financial figures hidden. Showing operational focus.');
    }
  },

  togglePinFeedback: (feedbackId) => {
    const currentPinned = get().pinnedFeedbackIds;
    let updated;
    if (currentPinned.includes(feedbackId)) {
      updated = currentPinned.filter((id) => id !== feedbackId);
      toast.info('Visitor comment unpinned from spotlight.');
    } else {
      updated = [...currentPinned, feedbackId];
      toast.success('Visitor comment pinned to spotlight showcase.');
    }
    localStorage.setItem('coop_pinned_feedback', JSON.stringify(updated));
    set({ pinnedFeedbackIds: updated });
  },
}));

export default useAnalyticsStore;
