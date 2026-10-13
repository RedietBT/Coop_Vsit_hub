import apiClient from '@/core/api/apiClient';

export const notificationApi = {
  getMyNotifications: async (page = 0, size = 20, unreadOnly = false) => {
    const response = await apiClient.get('/api/v1/notifications', {
      params: { page, size, unreadOnly },
    });
    return response.data;
  },

  getUnreadCount: async () => {
    const response = await apiClient.get('/api/v1/notifications/unread-count');
    return response.data; // { unreadCount: number }
  },

  markAsRead: async (notificationId) => {
    const response = await apiClient.patch(`/api/v1/notifications/${notificationId}/read`);
    return response.data;
  },

  markAllAsRead: async () => {
    const response = await apiClient.patch('/api/v1/notifications/mark-all-read');
    return response.data;
  },

  dismissNotification: async (notificationId) => {
    const response = await apiClient.delete(`/api/v1/notifications/${notificationId}`);
    return response.data;
  },
};

export default notificationApi;
