import { create } from 'zustand';
import { toast } from 'sonner';
import notificationApi from '../api/notificationApi';
import soundPlayer from '@/core/utils/soundPlayer';

export const useNotificationStore = create((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  isDrawerOpen: false,
  error: null,
  knownIds: new Set(),

  openDrawer: () => set({ isDrawerOpen: true }),
  closeDrawer: () => set({ isDrawerOpen: false }),
  toggleDrawer: () => set((state) => ({ isDrawerOpen: !state.isDrawerOpen })),

  fetchNotifications: async (page = 0, size = 20) => {
    set({ isLoading: true, error: null });
    try {
      const data = await notificationApi.getMyNotifications(page, size);
      const items = (data.content || data || []).map((n) => ({
        ...n,
        read: n.read ?? n.isRead ?? false,
      }));

      const unread = items.filter((n) => !n.read).length;

      // Update known IDs
      const currentKnown = new Set(get().knownIds);
      items.forEach((n) => currentKnown.add(n.id));

      set({
        notifications: items,
        unreadCount: unread,
        isLoading: false,
        knownIds: currentKnown,
      });
    } catch (err) {
      set({
        isLoading: false,
        error: err.response?.data?.message || 'Failed to load notifications',
      });
    }
  },

  fetchUnreadCount: async (playChimeAndToast = false) => {
    try {
      const res = await notificationApi.getUnreadCount();
      const newCount = typeof res === 'number' ? res : res?.unreadCount ?? res?.count ?? 0;
      const currentCount = get().unreadCount;

      if (playChimeAndToast && newCount > currentCount) {
        // Fetch new items to identify what arrived and display toaster
        try {
          const data = await notificationApi.getMyNotifications(0, 5, true);
          const freshItems = (data.content || data || []).map((n) => ({
            ...n,
            read: n.read ?? n.isRead ?? false,
          }));

          const known = get().knownIds;
          const brandNewItems = freshItems.filter((n) => !known.has(n.id));

          if (brandNewItems.length > 0) {
            // Play audio notification chime
            soundPlayer.playNotificationChime();

            // Display Toast notification for the new item(s)
            brandNewItems.forEach((item) => {
              toast.info(item.title || 'New Visit Notification', {
                description: item.message,
                duration: 6000,
                action: item.referenceId
                  ? {
                      label: 'View Record',
                      onClick: () => {
                        if (typeof window !== 'undefined') {
                          window.location.href = `/visits/${item.referenceId}`;
                        }
                      },
                    }
                  : undefined,
              });
            });

            // Update known IDs and notification list
            const updatedKnown = new Set(known);
            brandNewItems.forEach((n) => updatedKnown.add(n.id));

            set((state) => ({
              notifications: [...brandNewItems, ...state.notifications],
              knownIds: updatedKnown,
            }));
          } else {
            soundPlayer.playNotificationChime();
          }
        } catch (fetchErr) {
          soundPlayer.playNotificationChime();
        }
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
          n.id === notificationId ? { ...n, read: true } : n
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
        notifications: state.notifications.map((n) => ({ ...n, read: true })),
        unreadCount: 0,
      }));
      toast.success('All notifications marked as read.');
    } catch (err) {
      console.error('Failed to mark all notifications as read:', err);
      toast.error('Failed to mark all notifications as read.');
    }
  },

  dismissNotification: async (notificationId) => {
    try {
      await notificationApi.dismissNotification(notificationId);
      set((state) => {
        const item = state.notifications.find((n) => n.id === notificationId);
        const decrement = item && !item.read ? 1 : 0;
        return {
          notifications: state.notifications.filter((n) => n.id !== notificationId),
          unreadCount: Math.max(0, state.unreadCount - decrement),
        };
      });
      toast.success('Notification dismissed.');
    } catch (err) {
      console.error('Failed to dismiss notification:', err);
      toast.error('Failed to dismiss notification.');
    }
  },
}));

export default useNotificationStore;
