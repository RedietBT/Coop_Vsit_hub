import { create } from 'zustand';
import notificationApi from '../api/notificationApi';
import soundPlayer from '@/core/utils/soundPlayer';

export const useNotificationStore = create((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  isDrawerOpen: false,
  error: null,

  openDrawer: () => set({ isDrawerOpen: true }),
  closeDrawer: () => set({ isDrawerOpen: false }),
  toggleDrawer: () => set((state) => ({ isDrawerOpen: !state.isDrawerOpen })),

  fetchNotifications: async (page = 0, size = 20) => {
    set({ isLoading: true, error: null });
    try {
      const data = await notificationApi.getMyNotifications(page, size);
      const items = data.content || data || [];
      const unread = items.filter((n) => !n.isRead).length;

      set({
        notifications: items,
        unreadCount: unread,
        isLoading: false,
      });
    } catch (err) {
      set({
        isLoading: false,
        error: err.response?.data?.message || 'Failed to load notifications',
      });
    }
  },

  fetchUnreadCount: async (playChimeOnIncrease = false) => {
    try {
      const res = await notificationApi.getUnreadCount();
      const newCount = typeof res === 'number' ? res : res?.count || 0;
      const currentCount = get().unreadCount;

      if (playChimeOnIncrease && newCount > currentCount) {
        soundPlayer.playNotificationChime();
      }

      set({ unreadCount: newCount });
    } catch (err) {
      console.warn('Failed to poll unread notifications count:', err);
    }
  },

  markAsRead: async (notificationId) => {
    try {
      await notificationApi.markAsRead(notificationId);
      set((state) => ({
        notifications: state.notifications.map((n) =>
          n.id === notificationId ? { ...n, isRead: true } : n
        ),
        unreadCount: Math.max(0, state.unreadCount - 1),
      }));
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  },

  markAllAsRead: async () => {
    try {
      await notificationApi.markAllAsRead();
      set((state) => ({
        notifications: state.notifications.map((n) => ({ ...n, isRead: true })),
        unreadCount: 0,
      }));
    } catch (err) {
      console.error('Failed to mark all notifications as read:', err);
    }
  },

  dismissNotification: async (notificationId) => {
    try {
      await notificationApi.dismissNotification(notificationId);
      set((state) => {
        const item = state.notifications.find((n) => n.id === notificationId);
        const decrement = item && !item.isRead ? 1 : 0;
        return {
          notifications: state.notifications.filter((n) => n.id !== notificationId),
          unreadCount: Math.max(0, state.unreadCount - decrement),
        };
      });
    } catch (err) {
      console.error('Failed to dismiss notification:', err);
    }
  },
}));

export default useNotificationStore;
